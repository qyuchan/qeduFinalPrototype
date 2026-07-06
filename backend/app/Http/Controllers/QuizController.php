<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateRecommendationsJob;
use App\Models\AttemptUpload;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Recommendation;
use App\Models\StudentAnswer;
use App\Models\StudentTopicMastery;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    private const WEAK_THRESHOLD = 60.0;
    private const MASTERY_LEVELS = [
        [0,  40,  'not_started'],
        [40, 60,  'learning'],
        [60, 80,  'practicing'],
        [80, 101, 'mastered'],
    ];

    public function topics(): JsonResponse
    {
        return response()->json(
            Topic::where('is_active', true)
                ->whereNull('parent_topic_id')
                ->orderBy('sequence_order')
                ->get(['topic_id', 'topic_name', 'difficulty_level', 'description', 'syllabus', 'sequence_order'])
        );
    }

    public function topicSubtopics(int $topicId): JsonResponse
    {
        $subtopics = Topic::where('parent_topic_id', $topicId)
            ->where('is_active', true)
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order']);
        return response()->json($subtopics);
    }

    public function availableSets(int $topicId): JsonResponse
    {
        $sets = Quiz::where('topic_id', $topicId)
            ->where('quiz_type', 'formative')
            ->where('is_active', true)
            ->whereNotNull('set_number')
            ->orderBy('set_number')
            ->pluck('set_number');

        return response()->json($sets);
    }

    public function fetch(Request $request, int $topicId): JsonResponse
    {
        $set   = (int) $request->query('set', 0); // 1-based; 0 = lowest available set
        $query = Quiz::where('topic_id', $topicId)
            ->where('quiz_type', 'formative')
            ->where('is_active', true);

        // Questions and options are always in a fixed order so the same set looks
        // identical for every student. Shuffling is intentionally disabled.
        $with = [
            'questions'         => fn ($q) => $q->orderBy('question_id'),
            'questions.options' => fn ($q) => $q->orderBy('option_id'),
        ];

        $quiz = ($set > 0)
            ? $query->where('set_number', $set)->with($with)->firstOrFail()
            : $query->orderBy('set_number')->with($with)->firstOrFail();

        $quiz->questions->each(fn($q) => $q->options->makeHidden('is_correct'));

        return response()->json($quiz);
    }

    public function submit(Request $request, int $quizId): JsonResponse
    {
        $validated = $request->validate([
            'answers'   => 'required|array',
            'answers.*' => 'required|integer|exists:question_options,option_id',
        ]);

        $quiz   = Quiz::with('questions.options')->findOrFail($quizId);
        $userId = $request->user()->user_id;

        DB::beginTransaction();
        try {
            $graded        = $this->gradeAnswers($quiz, $validated['answers']);
            $attemptNumber = QuizAttempt::where('quiz_id', $quizId)
                ->where('student_id', $userId)
                ->count() + 1;

            $attempt = QuizAttempt::create([
                'quiz_id'        => $quizId,
                'student_id'     => $userId,
                'attempt_number' => $attemptNumber,
                'score'          => $graded['raw_score'],
                'percentage'     => $graded['percentage'],
                'pass_status'    => $graded['percentage'] >= $quiz->passing_threshold ? 'pass' : 'fail',
                'started_at'     => now()->subMinutes(5),
                'submitted_at'   => now(),
            ]);

            StudentAnswer::insert(
                array_map(fn($d) => [
                    'attempt_id'         => $attempt->attempt_id,
                    'question_id'        => $d['question_id'],
                    'selected_option_id' => $d['selected_option_id'],
                    'is_correct'         => $d['is_correct'],
                    'marks_awarded'      => $d['marks_awarded'],
                ], $graded['details'])
            );

            $mastery = $this->updateMastery($userId, $quiz->topic_id, $graded['percentage']);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        // Find subtopics the student got wrong (from subtopic_id on questions)
        $wrongSubtopics = DB::table('student_answers')
            ->join('questions', 'student_answers.question_id', '=', 'questions.question_id')
            ->where('student_answers.attempt_id', $attempt->attempt_id)
            ->where('student_answers.is_correct', false)
            ->whereNotNull('questions.subtopic_id')
            ->distinct()
            ->pluck('questions.subtopic_id')
            ->toArray();

        // If the student answered a concept wrong again, resurface any dismissed
        // General Review (lecturer remediation) cards for that concept.
        $wrongTopicTags = DB::table('student_answers')
            ->join('questions', 'student_answers.question_id', '=', 'questions.question_id')
            ->where('student_answers.attempt_id', $attempt->attempt_id)
            ->where('student_answers.is_correct', false)
            ->whereNotNull('questions.topic_tag')
            ->distinct()
            ->pluck('questions.topic_tag');

        if ($wrongTopicTags->isNotEmpty()) {
            $remediationIds = DB::table('question_remediations')
                ->join('questions', 'question_remediations.question_id', '=', 'questions.question_id')
                ->whereIn('questions.topic_tag', $wrongTopicTags)
                ->pluck('question_remediations.remediation_id');

            if ($remediationIds->isNotEmpty()) {
                DB::table('student_remediation_dismissals')
                    ->where('student_id', $userId)
                    ->whereIn('remediation_id', $remediationIds)
                    ->delete();
            }
        }

        // Create or refresh a course-navigation recommendation per weak subtopic.
        // Never reset is_dismissed: respect the student's choice to hide a subtopic.
        foreach ($wrongSubtopics as $subtopic) {
            $existing = Recommendation::where([
                'user_id'             => $userId,
                'subtopic_id'         => $subtopic,
                'recommendation_type' => 'course_navigation',
            ])->first();

            if ($existing) {
                $existing->update([
                    'triggered_by_attempt' => $attempt->attempt_id,
                    'confidence_score'     => 1.0,
                    'is_dismissed'         => false,
                    'responded_at'         => null,
                ]);
            } else {
                Recommendation::create([
                    'user_id'             => $userId,
                    'subtopic_id'         => $subtopic,
                    'recommendation_type' => 'course_navigation',
                    'material_id'          => null,
                    'triggered_by_attempt' => $attempt->attempt_id,
                    'algorithm_used'       => 'content_based',
                    'reason'               => 'You answered questions incorrectly on this subtopic.',
                    'confidence_score'     => 1.0,
                    'is_dismissed'         => false,
                    'is_accepted'          => null,
                    'responded_at'         => null,
                ]);
            }
        }

        GenerateRecommendationsJob::dispatch($userId, $quiz->topic_id, $attempt->attempt_id, $wrongSubtopics);

        return response()->json([
            'attempt_id'  => $attempt->attempt_id,
            'raw_score'   => $graded['raw_score'],
            'percentage'  => $graded['percentage'],
            'pass_status' => $attempt->pass_status,
            'mastery'     => $mastery->mastery_level,
            'is_weak'     => $mastery->is_weak,
        ]);
    }

    public function result(Request $request, int $attemptId): JsonResponse
    {
        $attempt = QuizAttempt::with([
            'studentAnswers.question.options',
            'studentAnswers.question.remediations.lecturer:user_id,full_name',
            'studentAnswers.question.remediations.material',
            'recommendations.material',
            // Student-facing view: only show reviews they haven't already marked complete.
            // The lecturer-facing endpoints (LecturerController::getReview, etc.) are
            // untouched and still see every review regardless of student_completed_at.
            'reviews' => fn ($q) => $q->whereNull('student_completed_at'),
            'reviews.lecturer:user_id,full_name',
            'uploads',
            'quiz.topic:topic_id,topic_name',
        ])->findOrFail($attemptId);

        abort_unless($attempt->student_id === $request->user()->user_id, 403);

        return response()->json($attempt);
    }

    public function masteryOverview(Request $request): JsonResponse
    {
        $userId  = $request->user()->user_id;
        $mastery = StudentTopicMastery::where('student_id', $userId)
            ->with('topic:topic_id,topic_name,difficulty_level,sequence_order')
            ->get();

        $coursesCompleted = DB::table('student_subtopic_completions')
            ->where('student_id', $userId)
            ->select('topic_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('topic_id')
            ->pluck('cnt', 'topic_id');

        // Distinct set_numbers the student has actually submitted for each topic.
        $attemptedSets = DB::table('quiz_attempts')
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.quiz_id')
            ->where('quiz_attempts.student_id', $userId)
            ->whereNotNull('quizzes.set_number')
            ->select('quizzes.topic_id', 'quizzes.set_number')
            ->distinct()
            ->get()
            ->groupBy('topic_id')
            ->map(fn ($rows) => $rows->pluck('set_number')->sort()->values());

        // Total available formative sets per topic (for display in practice tab)
        $totalSets = DB::table('quizzes')
            ->where('quiz_type', 'formative')
            ->where('is_active', true)
            ->whereNotNull('set_number')
            ->select('topic_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('topic_id')
            ->pluck('cnt', 'topic_id');

        return response()->json($mastery->map(function ($m) use ($coursesCompleted, $attemptedSets, $totalSets) {
            $m->courses_completed     = (int) ($coursesCompleted[$m->topic_id] ?? 0);
            $m->attempted_set_numbers = ($attemptedSets[$m->topic_id] ?? collect())->values();
            $m->total_sets            = (int) ($totalSets[$m->topic_id] ?? 0);
            return $m;
        }));
    }

    // ── Subtopic completion (DB-backed course progress) ───────────────────────

    public function getSubtopicProgress(Request $request): JsonResponse
    {
        $ids = DB::table('student_subtopic_completions')
            ->where('student_id', $request->user()->user_id)
            ->pluck('subtopic_id');

        return response()->json($ids->values());
    }

    public function markSubtopicComplete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subtopic_id' => 'required|string|max:20',
            'topic_id'    => 'required|integer|exists:topics,topic_id',
        ]);

        DB::table('student_subtopic_completions')->upsert(
            [
                'student_id'   => $request->user()->user_id,
                'subtopic_id'  => $validated['subtopic_id'],
                'topic_id'     => $validated['topic_id'],
                'completed_at' => now(),
            ],
            ['student_id', 'subtopic_id'],
            ['completed_at']
        );

        return response()->json(['status' => 'ok']);
    }

    public function markSubtopicIncomplete(Request $request, string $subtopicId): JsonResponse
    {
        DB::table('student_subtopic_completions')
            ->where('student_id', $request->user()->user_id)
            ->where('subtopic_id', $subtopicId)
            ->delete();

        return response()->json(['status' => 'ok']);
    }

    public function uploadWork(Request $request, int $attemptId): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $attempt = QuizAttempt::findOrFail($attemptId);
        abort_unless($attempt->student_id === $request->user()->user_id, 403);

        $file   = $request->file('file');
        $path   = $file->store("uploads/work/{$attemptId}", 'public');

        $upload = AttemptUpload::create([
            'attempt_id'    => $attemptId,
            'student_id'    => $request->user()->user_id,
            'file_path'     => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'uploaded_at'   => now(),
        ]);

        return response()->json([
            'upload_id'     => $upload->upload_id,
            'url'           => $upload->url,
            'original_name' => $upload->original_name,
        ], 201);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function gradeAnswers(Quiz $quiz, array $submitted): array
    {
        $totalMarks  = 0;
        $earnedMarks = 0;
        $details     = [];

        foreach ($quiz->questions as $question) {
            $totalMarks   += $question->marks;
            $selectedId    = $submitted[$question->question_id] ?? null;
            $correctOption = $question->options->firstWhere('is_correct', true);
            $isCorrect     = $selectedId && $selectedId == $correctOption?->option_id;
            $marksAwarded  = $isCorrect ? $question->marks : 0;

            if ($isCorrect) $earnedMarks += $question->marks;

            $details[] = [
                'question_id'        => $question->question_id,
                'selected_option_id' => $selectedId,
                'is_correct'         => $isCorrect,
                'marks_awarded'      => $marksAwarded,
            ];
        }

        return [
            'raw_score'  => $earnedMarks,
            'percentage' => $totalMarks > 0 ? round(($earnedMarks / $totalMarks) * 100, 2) : 0,
            'details'    => $details,
        ];
    }

    private function updateMastery(int $userId, int $topicId, float $percentage): StudentTopicMastery
    {
        $mastery  = StudentTopicMastery::firstOrNew([
            'student_id' => $userId,
            'topic_id'   => $topicId,
        ]);

        $attempts  = $mastery->quiz_attempts_count + 1;
        $prevScore = $mastery->mastery_score ?? 0;
        $newScore  = $mastery->quiz_attempts_count > 0
            ? (($prevScore * $mastery->quiz_attempts_count) + $percentage) / $attempts
            : $percentage;

        $mastery->mastery_score       = round($newScore, 2);
        $mastery->quiz_attempts_count = $attempts;
        $mastery->best_score          = max($mastery->best_score ?? 0, $percentage);
        $mastery->last_attempt_at     = now();
        $mastery->is_weak             = $newScore < self::WEAK_THRESHOLD;
        $mastery->mastery_level       = $this->scoreToLevel($newScore);
        $mastery->save();

        return $mastery;
    }

    private function scoreToLevel(float $score): string
    {
        foreach (self::MASTERY_LEVELS as [$min, $max, $level]) {
            if ($score >= $min && $score < $max) {
                return $level;
            }
        }
        return 'mastered';
    }
}
