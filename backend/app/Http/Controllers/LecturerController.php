<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\ClassRoom;
use App\Models\ClassEnrollment;
use App\Models\Topic;
use App\Models\LearningMaterial;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\QuestionRemediation;
use App\Models\FlaggedQuestionDismissal;
use App\Models\AttemptReview;
use App\Models\QuizAttempt;
use App\Models\StudentAnswer;
use App\Models\StudentTopicMastery;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LecturerController extends Controller
{
    private function ensureLecturer(Request $request): void
    {
        if ($request->user()->role !== 'lecturer') {
            abort(403, 'Forbidden');
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private function ownedClass(Request $request, int $classId): ClassRoom
    {
        return ClassRoom::where('class_id', $classId)
            ->where('lecturer_id', $request->user()->user_id)
            ->firstOrFail();
    }

    private function getOrCreateCourse(int $userId): Course
    {
        return Course::firstOrCreate(
            ['course_code' => 'MAT423'],
            [
                'course_name' => 'Linear Algebra',
                'description' => 'Matrices, Determinants, and Systems of Linear Equations',
                'credit_hours' => 3,
                'is_active'   => true,
                'created_by'  => $userId,
            ]
        );
    }

    // ── Topics ────────────────────────────────────────────────────────────────

    public function topics(Request $request)
    {
        $this->ensureLecturer($request);
        return Topic::where('is_active', true)
            ->whereNull('parent_topic_id')
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'difficulty_level', 'description', 'syllabus', 'sequence_order', 'estimated_hours']);
    }

    public function topicSubtopics(Request $request, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopics = Topic::where('parent_topic_id', $id)
            ->where('is_active', true)
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order']);
        return response()->json($subtopics);
    }

    public function storeSubtopic(Request $request, int $parentId): JsonResponse
    {
        $this->ensureLecturer($request);
        $parent = Topic::whereNull('parent_topic_id')->where('is_active', true)->findOrFail($parentId);

        $data = $request->validate([
            'topic_name'     => 'required|string|max:150',
            'description'    => 'nullable|string',
            'syllabus'       => 'nullable|string',
            'sequence_order' => 'required|integer|min:1',
        ]);

        $subtopic = Topic::create([
            'course_id'        => $parent->course_id,
            'parent_topic_id'  => $parentId,
            'topic_name'       => $data['topic_name'],
            'description'      => $data['description'] ?? null,
            'syllabus'         => $data['syllabus'] ?? null,
            'sequence_order'   => $data['sequence_order'],
            'difficulty_level' => $parent->difficulty_level,
            'is_active'        => true,
        ]);

        return response()->json($subtopic->only([
            'topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order',
        ]), 201);
    }

    public function updateSubtopic(Request $request, int $parentId, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopic = Topic::where('parent_topic_id', $parentId)->where('is_active', true)->findOrFail($id);

        $data = $request->validate([
            'topic_name'     => 'sometimes|string|max:150',
            'description'    => 'nullable|string',
            'syllabus'       => 'nullable|string',
            'sequence_order' => 'sometimes|integer|min:1',
        ]);

        $subtopic->update($data);
        return response()->json($subtopic->fresh()->only([
            'topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order',
        ]));
    }

    public function uploadSubtopicSlide(Request $request, int $parentId, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopic = Topic::where('parent_topic_id', $parentId)->where('is_active', true)->findOrFail($id);

        $request->validate([
            'slide' => 'required|file|mimes:pdf,pptx,ppt|max:51200',
        ]);

        if ($subtopic->slide_file_path) {
            Storage::disk('public')->delete($subtopic->slide_file_path);
        }

        $path = $request->file('slide')->store("slides/{$id}", 'public');
        $subtopic->update(['slide_file_path' => $path]);

        return response()->json([
            'slide_file_path' => $path,
            'slide_url'       => $subtopic->fresh()->slide_url,
        ]);
    }

    public function deleteSubtopicSlide(Request $request, int $parentId, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopic = Topic::where('parent_topic_id', $parentId)->where('is_active', true)->findOrFail($id);

        if ($subtopic->slide_file_path) {
            Storage::disk('public')->delete($subtopic->slide_file_path);
            $subtopic->update(['slide_file_path' => null]);
        }

        return response()->json(['message' => 'Slide removed']);
    }

    public function destroySubtopic(Request $request, int $parentId, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopic = Topic::where('parent_topic_id', $parentId)->where('is_active', true)->findOrFail($id);

        if ($request->boolean('permanent')) {
            if ($subtopic->slide_file_path) {
                Storage::disk('public')->delete($subtopic->slide_file_path);
            }
            $subtopic->delete();
            return response()->json(['message' => 'Subtopic permanently deleted']);
        }

        $subtopic->update(['is_active' => false]);
        return response()->json(['message' => 'Subtopic hidden']);
    }

    public function hiddenSubtopics(Request $request, int $parentId): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopics = Topic::where('parent_topic_id', $parentId)
            ->where('is_active', false)
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order']);
        return response()->json($subtopics);
    }

    public function restoreSubtopic(Request $request, int $parentId, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $subtopic = Topic::where('parent_topic_id', $parentId)->where('is_active', false)->findOrFail($id);
        $subtopic->update(['is_active' => true]);

        return response()->json($subtopic->only([
            'topic_id', 'topic_name', 'description', 'syllabus', 'slide_file_path', 'sequence_order',
        ]));
    }

    public function storeTopic(Request $request): JsonResponse
    {
        $this->ensureLecturer($request);

        $data = $request->validate([
            'topic_name'       => 'required|string|max:150',
            'description'      => 'nullable|string',
            'syllabus'         => 'nullable|string',
            'difficulty_level' => 'required|in:basic,intermediate,advanced',
            'sequence_order'   => 'required|integer|min:1',
            'estimated_hours'  => 'nullable|numeric|min:0.5|max:999',
        ]);

        $course = $this->getOrCreateCourse($request->user()->user_id);

        $topic = Topic::create([
            'course_id'        => $course->course_id,
            'topic_name'       => $data['topic_name'],
            'description'      => $data['description'] ?? null,
            'syllabus'         => $data['syllabus'] ?? null,
            'difficulty_level' => $data['difficulty_level'],
            'sequence_order'   => $data['sequence_order'],
            'estimated_hours'  => $data['estimated_hours'] ?? null,
            'is_active'        => true,
        ]);

        return response()->json($topic->only([
            'topic_id', 'topic_name', 'difficulty_level', 'description', 'syllabus', 'sequence_order', 'estimated_hours',
        ]), 201);
    }

    public function updateTopic(Request $request, int $id): JsonResponse
    {
        $this->ensureLecturer($request);

        $topic = Topic::where('is_active', true)->findOrFail($id);

        $data = $request->validate([
            'topic_name'       => 'sometimes|string|max:150',
            'description'      => 'nullable|string',
            'syllabus'         => 'nullable|string',
            'difficulty_level' => 'sometimes|in:basic,intermediate,advanced',
            'sequence_order'   => 'sometimes|integer|min:1',
            'estimated_hours'  => 'nullable|numeric|min:0.5|max:999',
        ]);

        $topic->update($data);

        return response()->json($topic->fresh()->only([
            'topic_id', 'topic_name', 'difficulty_level', 'description', 'syllabus', 'sequence_order', 'estimated_hours',
        ]));
    }

    public function hiddenTopics(Request $request): JsonResponse
    {
        $this->ensureLecturer($request);
        $topics = Topic::where('is_active', false)
            ->whereNull('parent_topic_id')
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'difficulty_level', 'description', 'sequence_order', 'estimated_hours']);
        return response()->json($topics);
    }

    public function restoreTopic(Request $request, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $topic = Topic::where('is_active', false)->findOrFail($id);
        $topic->update(['is_active' => true]);
        // Also restore its subtopics
        Topic::where('parent_topic_id', $id)->update(['is_active' => true]);
        return response()->json($topic->only([
            'topic_id', 'topic_name', 'difficulty_level', 'description', 'syllabus', 'sequence_order', 'estimated_hours',
        ]));
    }

    public function destroyTopic(Request $request, int $id): JsonResponse
    {
        $this->ensureLecturer($request);

        $topic = Topic::where('is_active', true)->findOrFail($id);

        if ($request->boolean('permanent')) {
            // Delete slide files for all subtopics first
            Topic::where('parent_topic_id', $id)->each(function ($sub) {
                if ($sub->slide_file_path) {
                    Storage::disk('public')->delete($sub->slide_file_path);
                }
                $sub->delete();
            });
            $topic->delete();
            return response()->json(['message' => 'Topic permanently deleted']);
        }

        $topic->update(['is_active' => false]);
        return response()->json(['message' => 'Topic hidden']);
    }

    // ── Class management ──────────────────────────────────────────────────────

    public function classes(Request $request)
    {
        $this->ensureLecturer($request);
        return ClassRoom::where('lecturer_id', $request->user()->user_id)
            ->with('course')
            ->withCount(['enrollments as student_count'])
            ->orderByDesc('class_id')
            ->get();
    }

    public function storeClass(Request $request)
    {
        $this->ensureLecturer($request);
        $data = $request->validate([
            'class_name'       => 'required|string|max:50',
            'semester'         => 'required|in:1,2,3,short',
            'academic_year'    => ['required', 'string', 'regex:/^\d{4}\/\d{4}$/'],
            'enrollment_limit' => 'nullable|integer|min:1|max:200',
        ]);

        $course = $this->getOrCreateCourse($request->user()->user_id);

        $class = ClassRoom::create([
            ...$data,
            'course_id'   => $course->course_id,
            'lecturer_id' => $request->user()->user_id,
            'is_active'   => true,
        ]);

        return response()->json($class->load('course'), 201);
    }

    public function updateClass(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $class = $this->ownedClass($request, $id);

        $data = $request->validate([
            'class_name'       => 'sometimes|string|max:50',
            'semester'         => 'sometimes|in:1,2,3,short',
            'academic_year'    => ['sometimes', 'string', 'regex:/^\d{4}\/\d{4}$/'],
            'enrollment_limit' => 'nullable|integer|min:1|max:200',
            'is_active'        => 'boolean',
        ]);

        $class->update($data);
        return $class->fresh()->load('course');
    }

    public function destroyClass(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $this->ownedClass($request, $id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Enrollment management ─────────────────────────────────────────────────

    public function classStudents(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $this->ownedClass($request, $id);

        return ClassEnrollment::where('class_id', $id)
            ->where('status', 'active')
            ->with('student:user_id,full_name,email,student_id')
            ->get()
            ->map(fn ($e) => [
                'enrollment_id' => $e->enrollment_id,
                'user_id'       => $e->student->user_id,
                'full_name'     => $e->student->full_name,
                'student_id'    => $e->student->student_id,
                'email'         => $e->student->email,
                'enrolled_at'   => $e->enrolled_at,
            ]);
    }

    public function enrollStudent(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $class = $this->ownedClass($request, $id);

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,user_id',
        ]);

        $student = User::where('user_id', $data['user_id'])
            ->where('role', 'student')
            ->firstOrFail();

        $alreadyActive = ClassEnrollment::where('class_id', $class->class_id)
            ->where('student_id', $student->user_id)
            ->where('status', 'active')
            ->exists();

        if ($alreadyActive) {
            return response()->json(['message' => 'Student is already enrolled in this class.'], 409);
        }

        // A student's mastery/quiz data should only be visible to the one lecturer
        // actually teaching them: without this, any lecturer could claim a student
        // already enrolled elsewhere and see their academic data.
        $conflictingEnrollment = ClassEnrollment::where('student_id', $student->user_id)
            ->where('status', 'active')
            ->whereHas('classRoom', fn ($q) => $q->where('lecturer_id', '!=', $request->user()->user_id))
            ->with('classRoom.lecturer:user_id,email')
            ->first();

        if ($conflictingEnrollment) {
            $otherLecturerEmail = $conflictingEnrollment->classRoom->lecturer->email;
            return response()->json([
                'message' => "This student is already enrolled in another lecturer's class. Please contact {$otherLecturerEmail} to resolve this issue.",
            ], 409);
        }

        $enrollment = ClassEnrollment::updateOrCreate(
            ['class_id' => $class->class_id, 'student_id' => $student->user_id],
            ['status'   => 'active']
        );

        return response()->json([
            'enrollment_id' => $enrollment->enrollment_id,
            'user_id'       => $student->user_id,
            'full_name'     => $student->full_name,
            'student_id'    => $student->student_id,
            'email'         => $student->email,
            'enrolled_at'   => $enrollment->enrolled_at,
        ], 201);
    }

    public function unenrollStudent(Request $request, $classId, $userId)
    {
        $this->ensureLecturer($request);
        $this->ownedClass($request, $classId);

        ClassEnrollment::where('class_id', $classId)
            ->where('student_id', $userId)
            ->update(['status' => 'withdrawn']);

        return response()->json(['message' => 'Removed']);
    }

    public function searchStudents(Request $request)
    {
        $this->ensureLecturer($request);
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) return response()->json([]);

        $isNumeric = ctype_digit($q);

        return User::where('role', 'student')
            ->where('is_active', true)
            ->where(function ($query) use ($q, $isNumeric) {
                if ($isNumeric) {
                    $query->where('student_id', $q);
                } else {
                    $query->where('full_name',  'ilike', "%{$q}%")
                          ->orWhere('email',     'ilike', "%{$q}%")
                          ->orWhere('student_id','ilike', "%{$q}%");
                }
            })
            ->limit(10)
            ->get(['user_id', 'full_name', 'email', 'student_id']);
    }

    // ── Mastery overview (scoped to enrolled students) ────────────────────────

    public function masteryOverview(Request $request)
    {
        $this->ensureLecturer($request);

        $lecturerId = $request->user()->user_id;
        $classId    = $request->query('class_id') ? (int) $request->query('class_id') : null;

        // 2 queries instead of 5: topics + one big JOIN for students/mastery/class-ownership
        $topics = Topic::where('is_active', true)
            ->whereNull('parent_topic_id')
            ->orderBy('sequence_order')
            ->get(['topic_id', 'topic_name', 'difficulty_level', 'description', 'sequence_order']);

        $rows = DB::table('class_enrollments as ce')
            ->join('classes as cr',                    'ce.class_id',   '=', 'cr.class_id')
            ->join('users as u',                       'ce.student_id', '=', 'u.user_id')
            ->leftJoin('student_topic_mastery as stm', 'stm.student_id','=', 'u.user_id')
            ->where('cr.lecturer_id', $lecturerId)
            ->where('ce.status', 'active')
            ->when($classId, fn ($q) => $q->where('ce.class_id', $classId))
            ->select(
                'u.user_id',
                'u.full_name',
                'u.student_id',
                'stm.topic_id',
                'stm.mastery_level',
                'stm.mastery_score',
                'stm.is_weak',
            )
            ->get();

        // Build student map: keying by topic_id deduplicates students enrolled in multiple classes
        $studentMap = [];
        foreach ($rows as $row) {
            $uid = $row->user_id;
            if (!isset($studentMap[$uid])) {
                $studentMap[$uid] = [
                    'user_id'    => $row->user_id,
                    'full_name'  => $row->full_name,
                    'student_id' => $row->student_id,
                    'masteries'  => [],
                ];
            }
            if ($row->topic_id !== null) {
                $studentMap[$uid]['masteries'][$row->topic_id] = [
                    'mastery_level' => $row->mastery_level,
                    'mastery_score' => $row->mastery_score,
                    'is_weak'       => (bool) $row->is_weak,
                ];
            }
        }

        return response()->json([
            'topics'   => $topics,
            'students' => array_values($studentMap),
        ]);
    }

    // ── Wrong questions for a specific attempt ────────────────────────────────

    public function attemptWrongQuestions(Request $request, int $studentId, int $attemptId): JsonResponse
    {
        $this->ensureLecturer($request);

        // Verify the attempt belongs to this student
        QuizAttempt::where('attempt_id', $attemptId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $wrongAnswers = StudentAnswer::where('attempt_id', $attemptId)
            ->where('is_correct', false)
            ->with([
                'question:question_id,question_text,difficulty_level,topic_tag',
                'question.options:option_id,question_id,option_text,is_correct,sequence_order',
            ])
            ->get();

        return response()->json($wrongAnswers->map(fn ($a) => [
            'answer_id'          => $a->answer_id,
            'question_id'        => $a->question_id,
            'selected_option_id' => $a->selected_option_id,
            'question_text'      => $a->question?->question_text,
            'difficulty_level'   => $a->question?->difficulty_level,
            'topic_tag'          => $a->question?->topic_tag,
            'options'            => $a->question?->options->sortBy('sequence_order')->values() ?? collect(),
        ]));
    }

    // ── Student mastery (per-student, for lecturer detail view) ──────────────

    public function studentMastery(Request $request, int $studentId): JsonResponse
    {
        $this->ensureLecturer($request);

        $mastery = StudentTopicMastery::where('student_id', $studentId)
            ->with('topic:topic_id,topic_name,difficulty_level,sequence_order,description')
            ->get();

        $coursesCompleted = DB::table('student_subtopic_completions')
            ->where('student_id', $studentId)
            ->select('topic_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('topic_id')
            ->pluck('cnt', 'topic_id');

        $attemptedSets = DB::table('quiz_attempts')
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.quiz_id')
            ->where('quiz_attempts.student_id', $studentId)
            ->whereNotNull('quizzes.set_number')
            ->select('quizzes.topic_id', 'quizzes.set_number')
            ->distinct()
            ->get()
            ->groupBy('topic_id')
            ->map(fn ($rows) => $rows->pluck('set_number')->sort()->values());

        return response()->json($mastery->map(function ($m) use ($coursesCompleted, $attemptedSets) {
            $m->courses_completed     = (int) ($coursesCompleted[$m->topic_id] ?? 0);
            $m->attempted_set_numbers = ($attemptedSets[$m->topic_id] ?? collect())->values();
            return $m;
        }));
    }

    // ── Student attempt history ───────────────────────────────────────────────

    public function studentAttempts(Request $request, int $studentId): JsonResponse
    {
        $this->ensureLecturer($request);

        $attempts = QuizAttempt::where('student_id', $studentId)
            ->with([
                'quiz:quiz_id,title,topic_id,set_number,quiz_type',
                'quiz.topic:topic_id,topic_name',
                'uploads',
                'reviews.lecturer:user_id,full_name',
            ])
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json($attempts);
    }

    public function storeReview(Request $request, int $attemptId): JsonResponse
    {
        $this->ensureLecturer($request);

        $request->validate([
            'comment' => 'nullable|string|max:2000',
            'file'    => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $data = [
            'attempt_id'  => $attemptId,
            'lecturer_id' => $request->user()->user_id,
            'comment'     => $request->input('comment') ?: null,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $data['file_path']     = $file->store("uploads/reviews/{$attemptId}", 'public');
            $data['original_name'] = $file->getClientOriginalName();
            $data['mime_type']     = $file->getMimeType();
            $data['file_size']     = $file->getSize();
        }

        $review = AttemptReview::updateOrCreate(
            ['attempt_id' => $attemptId, 'lecturer_id' => $request->user()->user_id],
            $data
        );

        return response()->json($review->fresh()->load('lecturer:user_id,full_name'));
    }

    public function getReview(Request $request, int $attemptId): JsonResponse
    {
        $this->ensureLecturer($request);

        $review = AttemptReview::where('attempt_id', $attemptId)
            ->where('lecturer_id', $request->user()->user_id)
            ->first();

        return response()->json($review);
    }

    // ── Materials ─────────────────────────────────────────────────────────────

    public function materials(Request $request)
    {
        $this->ensureLecturer($request);
        return LearningMaterial::with('topic')
            ->where('uploaded_by', $request->user()->user_id)
            ->orderByDesc('material_id')
            ->get();
    }

    // Read-only: every active material in a topic, regardless of who uploaded it.
    // Materials are a shared pool across all lecturers (only management is scoped
    // to your own uploads): this lets a lecturer see what already exists before
    // deciding whether to add their own, without granting edit/delete on it.
    public function allTopicMaterials(Request $request, int $topicId)
    {
        $this->ensureLecturer($request);
        return LearningMaterial::with(['topic', 'uploader:user_id,full_name,email'])
            ->where('topic_id', $topicId)
            ->where('is_active', true)
            ->orderByDesc('material_id')
            ->get();
    }

    // Tag/keyword suggestions for a topic, built from what other materials in that
    // topic already used (tags/keywords are stored as comma-separated strings, not
    // a normalised table). This grows on its own as materials get tagged, so it works
    // for any topic — including ones with no hardcoded suggestion list at all.
    public function topicTagSuggestions(Request $request, int $topicId): JsonResponse
    {
        $this->ensureLecturer($request);

        $rows = LearningMaterial::where('topic_id', $topicId)
            ->where('is_active', true)
            ->get(['tags', 'keywords']);

        $split = fn (string $field) => $rows
            ->pluck($field)
            ->filter()
            ->flatMap(fn ($csv) => explode(',', $csv))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'tags'     => $split('tags'),
            'keywords' => $split('keywords'),
        ]);
    }

    public function storeMaterial(Request $request)
    {
        $this->ensureLecturer($request);
        $data = $request->validate([
            'topic_id'         => 'required|integer|exists:topics,topic_id',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'content_type'     => 'required|in:pdf,video,article,exercise,example,summary',
            'external_url'     => 'nullable|url',
            'file'             => 'nullable|file|mimes:pdf|max:20480',
            'difficulty_level' => 'required|in:basic,intermediate,advanced',
            'tags'             => 'nullable|string',
            'keywords'         => 'nullable|string',
            'subtopic_id'      => 'nullable|string|max:20',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_remedial'      => 'boolean',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('materials', 'public');
        }

        $material = LearningMaterial::create([
            'topic_id'         => $data['topic_id'],
            'title'            => $data['title'],
            'description'      => $data['description'] ?? null,
            'content_type'     => $data['content_type'],
            'external_url'     => $data['external_url'] ?? null,
            'file_path'        => $filePath,
            'difficulty_level' => $data['difficulty_level'],
            'tags'             => $data['tags'] ?? null,
            'keywords'         => $data['keywords'] ?? null,
            'subtopic_id'      => $data['subtopic_id'] ?? null,
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'is_remedial'      => $data['is_remedial'] ?? false,
            'uploaded_by'      => $request->user()->user_id,
            'is_active'        => true,
        ]);

        $resource = $material->load('topic')->toArray();

        return response()->json($resource, 201);
    }

    public function updateMaterial(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $material = LearningMaterial::where('material_id', $id)
            ->where('uploaded_by', $request->user()->user_id)
            ->firstOrFail();

        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'content_type'     => 'sometimes|in:pdf,video,article,exercise,example,summary',
            'external_url'     => 'nullable|url',
            'difficulty_level' => 'sometimes|in:basic,intermediate,advanced',
            'tags'             => 'nullable|string',
            'keywords'         => 'nullable|string',
            'subtopic_id'      => 'nullable|string|max:20',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_remedial'      => 'boolean',
            'is_active'        => 'boolean',
        ]);

        $material->update($data);
        return $material->fresh()->load('topic');
    }

    public function destroyMaterial(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $material = LearningMaterial::where('material_id', $id)
            ->where('uploaded_by', $request->user()->user_id)
            ->firstOrFail();

        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json(['message' => 'Deleted']);
    }

    // ── Quizzes ───────────────────────────────────────────────────────────────

    public function quizzes(Request $request)
    {
        $this->ensureLecturer($request);
        // Shared across all lecturers (same reasoning as Materials): editing/deleting
        // stays scoped to created_by below, this list is just for visibility.
        return Quiz::with(['topic', 'creator:user_id,full_name,email'])
            ->withCount('questions')
            ->orderByDesc('quiz_id')
            ->get();
    }

    public function storeQuiz(Request $request)
    {
        $this->ensureLecturer($request);
        $data = $request->validate([
            'topic_id'                          => 'required|integer|exists:topics,topic_id',
            'title'                             => 'required|string|max:200',
            'description'                       => 'nullable|string',
            'passing_threshold'                 => 'required|numeric|min:0|max:100',
            'questions'                         => 'required|array|min:1',
            'questions.*.question_text'         => 'required|string',
            'questions.*.marks'                 => 'required|integer|min:1',
            'questions.*.difficulty_level'      => 'required|in:easy,medium,hard',
            'questions.*.topic_tag'             => 'nullable|string',
            'questions.*.subtopic_id'           => 'nullable|string|max:20',
            'questions.*.explanation'           => 'nullable|string',
            'questions.*.options'               => 'required|array|min:2',
            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct'  => 'required|boolean',
        ]);

        $totalMarks = collect($data['questions'])->sum('marks');

        // Summative/diagnostic/remedial quiz types were never actually reachable by
        // students (QuizController::fetch only ever serves 'formative'): creation
        // is locked to the one type that works instead of offering a dead choice.
        // class_id and time_limit_minutes were dropped the same way: neither was ever
        // read anywhere in the student-facing quiz flow, so they were pure dead weight.
        $setNumber = Quiz::where('topic_id', $data['topic_id'])
            ->where('quiz_type', 'formative')
            ->max('set_number') + 1 ?? 1;

        $quiz = Quiz::create([
            'topic_id'           => $data['topic_id'],
            'created_by'         => $request->user()->user_id,
            'title'              => $data['title'],
            'description'        => $data['description'] ?? null,
            'quiz_type'          => 'formative',
            'set_number'         => $setNumber,
            'total_marks'        => $totalMarks,
            'passing_threshold'  => $data['passing_threshold'],
            'is_active'          => true,
        ]);

        foreach ($data['questions'] as $i => $qData) {
            $question = Question::create([
                'quiz_id'          => $quiz->quiz_id,
                'question_text'    => $qData['question_text'],
                'question_type'    => 'mcq',
                'marks'            => $qData['marks'],
                'difficulty_level' => $qData['difficulty_level'],
                'topic_tag'        => $qData['topic_tag'] ?? null,
                'subtopic_id'      => $qData['subtopic_id'] ?? null,
                'explanation'      => $qData['explanation'] ?? null,
                'sequence_order'   => $i + 1,
                'is_active'        => true,
            ]);

            foreach ($qData['options'] as $j => $optData) {
                QuestionOption::create([
                    'question_id'    => $question->question_id,
                    'option_text'    => $optData['option_text'],
                    'is_correct'     => $optData['is_correct'],
                    'sequence_order' => $j + 1,
                ]);
            }
        }

        return response()->json($quiz->load('questions.options'), 201);
    }

    public function uploadQuestionFigure(Request $request, int $questionId): JsonResponse
    {
        $this->ensureLecturer($request);
        $question = \App\Models\Question::findOrFail($questionId);

        $request->validate(['figure' => 'required|file|image|max:10240']);

        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }

        $path = $request->file('figure')->store("question-figures/{$questionId}", 'public');
        $question->update(['image_path' => $path]);

        return response()->json(['image_path' => $path, 'image_url' => $question->fresh()->image_url]);
    }

    public function showQuiz(Request $request, $id)
    {
        $this->ensureLecturer($request);
        // Viewable by any lecturer (shared pool, same as quizzes()); editing/deleting
        // still checks created_by in updateQuiz()/destroyQuiz() below.
        $quiz = Quiz::where('quiz_id', $id)
            ->with(['questions.options', 'topic', 'creator:user_id,full_name,email'])
            ->firstOrFail();

        return response()->json(array_merge($quiz->toArray(), [
            'has_attempts' => QuizAttempt::where('quiz_id', $quiz->quiz_id)->exists(),
        ]));
    }

    public function destroyQuiz(Request $request, $id)
    {
        $this->ensureLecturer($request);
        $quiz = Quiz::where('quiz_id', $id)
            ->where('created_by', $request->user()->user_id)
            ->with('questions')
            ->firstOrFail();

        foreach ($quiz->questions as $question) {
            QuestionOption::where('question_id', $question->question_id)->delete();
        }
        Question::where('quiz_id', $quiz->quiz_id)->delete();
        $quiz->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function questionTags(Request $request): JsonResponse
    {
        $this->ensureLecturer($request);
        $tags = Question::whereHas('quiz', fn($q) => $q->where('created_by', $request->user()->user_id))
            ->whereNotNull('topic_tag')
            ->distinct()
            ->orderBy('topic_tag')
            ->pluck('topic_tag');
        return response()->json($tags);
    }

    public function updateQuiz(Request $request, int $id): JsonResponse
    {
        $this->ensureLecturer($request);
        $quiz = Quiz::where('quiz_id', $id)
            ->where('created_by', $request->user()->user_id)
            ->with('questions.options')
            ->firstOrFail();

        $data = $request->validate([
            'topic_id'                          => 'required|integer|exists:topics,topic_id',
            'title'                             => 'required|string|max:200',
            'description'                       => 'nullable|string',
            'passing_threshold'                 => 'required|numeric|min:0|max:100',
            'questions'                         => 'required|array|min:1',
            'questions.*.question_id'           => 'nullable|integer',
            'questions.*.question_text'         => 'required|string',
            'questions.*.marks'                 => 'required|integer|min:1',
            'questions.*.difficulty_level'      => 'required|in:easy,medium,hard',
            'questions.*.topic_tag'             => 'nullable|string',
            'questions.*.subtopic_id'           => 'nullable|string|max:20',
            'questions.*.explanation'           => 'nullable|string',
            'questions.*.options'               => 'required|array|min:2',
            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct'  => 'required|boolean',
        ]);

        $hasAttempts = QuizAttempt::where('quiz_id', $quiz->quiz_id)->exists();
        $totalMarks  = collect($data['questions'])->sum('marks');

        $quiz->update([
            'topic_id'           => $data['topic_id'],
            'title'              => $data['title'],
            'description'        => $data['description'] ?? null,
            'passing_threshold'  => $data['passing_threshold'],
            'total_marks'        => $totalMarks,
        ]);

        if ($hasAttempts) {
            // Safe mode: update question/option text in place, no structural changes
            $existingQMap = $quiz->questions->keyBy('question_id');
            foreach ($data['questions'] as $i => $qData) {
                $qId = $qData['question_id'] ?? null;
                if ($qId && $existingQMap->has($qId)) {
                    $q = $existingQMap[$qId];
                    $q->update([
                        'question_text'    => $qData['question_text'],
                        'marks'            => $qData['marks'],
                        'difficulty_level' => $qData['difficulty_level'],
                        'topic_tag'        => $qData['topic_tag'] ?? null,
                        'subtopic_id'      => $qData['subtopic_id'] ?? null,
                        'explanation'      => $qData['explanation'] ?? null,
                        'sequence_order'   => $i + 1,
                    ]);
                    // is_correct is intentionally left untouched here: once a student has
                    // attempted this quiz, their "correct answer" review depends on it staying
                    // fixed. Changing it later would make an already-graded attempt's review
                    // page silently disagree with what the student was actually scored against.
                    $existingOpts = $q->options->values();
                    foreach ($qData['options'] as $j => $optData) {
                        if (isset($existingOpts[$j])) {
                            $existingOpts[$j]->update([
                                'option_text' => $optData['option_text'],
                            ]);
                        }
                    }
                }
            }
        } else {
            // No attempts: full replace
            $submittedQIds = collect($data['questions'])->pluck('question_id')->filter()->values()->all();
            // Soft-delete removed questions
            $quiz->questions()->whereNotIn('question_id', $submittedQIds)->update(['is_active' => false]);

            foreach ($data['questions'] as $i => $qData) {
                $qId = $qData['question_id'] ?? null;
                if ($qId) {
                    $q = Question::find($qId);
                    if ($q) {
                        $q->update([
                            'question_text'    => $qData['question_text'],
                            'marks'            => $qData['marks'],
                            'difficulty_level' => $qData['difficulty_level'],
                            'topic_tag'        => $qData['topic_tag'] ?? null,
                            'subtopic_id'      => $qData['subtopic_id'] ?? null,
                            'explanation'      => $qData['explanation'] ?? null,
                            'sequence_order'   => $i + 1,
                            'is_active'        => true,
                        ]);
                        $q->options()->delete();
                        foreach ($qData['options'] as $j => $optData) {
                            QuestionOption::create([
                                'question_id'    => $q->question_id,
                                'option_text'    => $optData['option_text'],
                                'is_correct'     => $optData['is_correct'],
                                'sequence_order' => $j + 1,
                            ]);
                        }
                    }
                } else {
                    $question = Question::create([
                        'quiz_id'          => $quiz->quiz_id,
                        'question_text'    => $qData['question_text'],
                        'question_type'    => 'mcq',
                        'marks'            => $qData['marks'],
                        'difficulty_level' => $qData['difficulty_level'],
                        'topic_tag'        => $qData['topic_tag'] ?? null,
                        'subtopic_id'      => $qData['subtopic_id'] ?? null,
                        'explanation'      => $qData['explanation'] ?? null,
                        'sequence_order'   => $i + 1,
                        'is_active'        => true,
                    ]);
                    foreach ($qData['options'] as $j => $optData) {
                        QuestionOption::create([
                            'question_id'    => $question->question_id,
                            'option_text'    => $optData['option_text'],
                            'is_correct'     => $optData['is_correct'],
                            'sequence_order' => $j + 1,
                        ]);
                    }
                }
            }
        }

        $fresh = $quiz->fresh(['questions.options', 'topic']);
        return response()->json(array_merge($fresh->toArray(), ['has_attempts' => $hasAttempts]));
    }

    public function deleteQuestionFigure(Request $request, int $questionId): JsonResponse
    {
        $this->ensureLecturer($request);
        $question = Question::whereHas('quiz', fn($q) => $q->where('created_by', $request->user()->user_id))
            ->findOrFail($questionId);

        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
            $question->update(['image_path' => null]);
        }

        return response()->json(['message' => 'Figure removed.']);
    }

    // ── Flagged Questions & Remediations ──────────────────────────────────────

    public function flaggedQuestions(Request $request)
    {
        $this->ensureLecturer($request);

        $lecturerId = $request->user()->user_id;

        $flagged = DB::table('student_answers as sa')
            ->join('quiz_attempts as qa', 'sa.attempt_id', '=', 'qa.attempt_id')
            ->join('questions as q',  'sa.question_id', '=', 'q.question_id')
            ->join('quizzes as qz',   'q.quiz_id',      '=', 'qz.quiz_id')
            ->join('users as u',      'qa.student_id',  '=', 'u.user_id')
            ->leftJoin('flagged_question_dismissals as fqd', function ($join) use ($lecturerId) {
                $join->on('fqd.question_id', '=', 'q.question_id')
                     ->where('fqd.lecturer_id', '=', $lecturerId);
            })
            ->whereIn('q.quiz_id', fn ($sub) =>
                $sub->select('quiz_id')->from('quizzes')->where('created_by', $lecturerId)
            )
            ->where('sa.is_correct', false)
            ->where('u.role', 'student')
            // A question a lecturer dismissed stays hidden until a *new* wrong
            // answer (answered after the dismissal) brings it back.
            ->where(function ($w) {
                $w->whereNull('fqd.dismissed_at')
                  ->orWhereColumn('sa.answered_at', '>', 'fqd.dismissed_at');
            })
            ->groupBy('q.question_id', 'q.question_text', 'q.difficulty_level', 'q.topic_tag', 'q.quiz_id', 'qz.topic_id')
            ->select([
                'q.question_id',
                'q.quiz_id',
                'qz.topic_id',
                'q.question_text',
                'q.difficulty_level',
                'q.topic_tag',
                DB::raw('COUNT(sa.answer_id) as wrong_count'),
                DB::raw('COUNT(DISTINCT qa.student_id) as affected_students'),
            ])
            ->orderByDesc('wrong_count')
            ->get();

        $questionIds = $flagged->pluck('question_id');

        $remediations = QuestionRemediation::whereIn('question_id', $questionIds)
            ->with([
                'lecturer:user_id,full_name',
                'material:material_id,title,content_type,file_path,external_url,duration_minutes',
            ])
            ->get()
            ->groupBy('question_id');

        $options = QuestionOption::whereIn('question_id', $questionIds)
            ->orderBy('sequence_order')
            ->get(['option_id', 'question_id', 'option_text', 'is_correct'])
            ->groupBy('question_id');

        return response()->json(
            $flagged->map(fn ($q) => [
                ...(array) $q,
                'options'      => $options->get($q->question_id, collect())->values(),
                'remediations' => $remediations->get($q->question_id, collect())->values(),
            ])
        );
    }

    public function dismissFlaggedQuestion(Request $request, $questionId)
    {
        $this->ensureLecturer($request);

        $question = Question::where('question_id', $questionId)
            ->whereHas('quiz', fn ($q) => $q->where('created_by', $request->user()->user_id))
            ->firstOrFail();

        FlaggedQuestionDismissal::updateOrCreate(
            ['lecturer_id' => $request->user()->user_id, 'question_id' => $question->question_id],
            ['dismissed_at' => now()]
        );

        return response()->json(['message' => 'Dismissed.']);
    }

    public function storeRemediation(Request $request, $questionId)
    {
        $this->ensureLecturer($request);

        $question = Question::where('question_id', $questionId)
            ->whereHas('quiz', fn ($q) => $q->where('created_by', $request->user()->user_id))
            ->firstOrFail();

        $data = $request->validate([
            'material_id'        => 'nullable|integer|exists:learning_materials,material_id',
            'custom_explanation' => 'nullable|string|max:2000',
        ]);

        if (empty($data['material_id']) && empty($data['custom_explanation'])) {
            return response()->json(['message' => 'Provide either a material or an explanation.'], 422);
        }

        $remediation = QuestionRemediation::create([
            'question_id'        => $question->question_id,
            'lecturer_id'        => $request->user()->user_id,
            'material_id'        => $data['material_id'] ?? null,
            'custom_explanation' => $data['custom_explanation'] ?? null,
        ]);

        return response()->json(
            $remediation->load('lecturer:user_id,full_name', 'material:material_id,title,content_type,file_path,external_url,duration_minutes'),
            201
        );
    }

    public function destroyRemediation(Request $request, $id)
    {
        $this->ensureLecturer($request);
        QuestionRemediation::where('remediation_id', $id)
            ->where('lecturer_id', $request->user()->user_id)
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
