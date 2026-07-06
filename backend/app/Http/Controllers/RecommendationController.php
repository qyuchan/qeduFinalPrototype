<?php

namespace App\Http\Controllers;

use App\Models\AttemptReview;
use App\Models\Recommendation;
use App\Models\QuestionRemediation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $recs = Recommendation::where('user_id', $request->user()->user_id)
            ->where('is_dismissed', false)
            ->with('material:material_id,title,content_type,external_url,duration_minutes,difficulty_level')
            ->orderByDesc('confidence_score')
            ->limit(10)
            ->get();

        return response()->json($recs);
    }

    public function accept(Request $request, int $id): JsonResponse
    {
        $rec = Recommendation::where('user_id', $request->user()->user_id)
            ->findOrFail($id);

        $rec->update([
            'is_accepted'  => true,
            'responded_at' => now(),
        ]);

        return response()->json(['status' => 'accepted']);
    }

    public function dismiss(Request $request, int $id): JsonResponse
    {
        $rec = Recommendation::where('user_id', $request->user()->user_id)
            ->findOrFail($id);

        $rec->update([
            'is_dismissed' => true,
            'is_accepted'  => false,
            'responded_at' => now(),
        ]);

        return response()->json(['status' => 'dismissed']);
    }

    public function lecturerReviews(Request $request): JsonResponse
    {
        $studentId = $request->user()->user_id;

        $reviews = AttemptReview::whereHas('attempt', fn ($q) => $q->where('student_id', $studentId))
            ->whereNull('student_completed_at')
            ->with([
                'lecturer:user_id,full_name',
                'attempt:attempt_id,quiz_id,score,percentage,pass_status,submitted_at',
                'attempt.quiz:quiz_id,title,topic_id,set_number,quiz_type',
                'attempt.quiz.topic:topic_id,topic_name',
            ])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($reviews);
    }

    public function completeReview(Request $request, int $reviewId): JsonResponse
    {
        $studentId = $request->user()->user_id;

        $review = AttemptReview::whereHas('attempt', fn ($q) => $q->where('student_id', $studentId))
            ->findOrFail($reviewId);

        $review->update(['student_completed_at' => now()]);

        return response()->json(['status' => 'completed']);
    }

    public function lecturerRemediations(Request $request): JsonResponse
    {
        $studentId = $request->user()->user_id;

        // Get topic_tags of all questions the student has answered incorrectly.
        // Matching by topic_tag (not exact question_id) means remediations apply
        // across quiz sets; a lecturer remediates the concept, not just one question instance.
        $wrongTopicTags = DB::table('student_answers as sa')
            ->join('quiz_attempts as qa', 'sa.attempt_id', '=', 'qa.attempt_id')
            ->join('questions as q', 'sa.question_id', '=', 'q.question_id')
            ->where('qa.student_id', $studentId)
            ->where('sa.is_correct', false)
            ->whereNotNull('q.topic_tag')
            ->distinct()
            ->pluck('q.topic_tag')
            ->unique()
            ->values();

        if ($wrongTopicTags->isEmpty()) {
            return response()->json([]);
        }

        $dismissedIds = DB::table('student_remediation_dismissals')
            ->where('student_id', $studentId)
            ->pluck('remediation_id');

        $remediations = QuestionRemediation::whereHas('question', fn ($q) => $q->whereIn('topic_tag', $wrongTopicTags))
            ->whereNotIn('remediation_id', $dismissedIds)
            ->with([
                'lecturer:user_id,full_name',
                'material:material_id,title,content_type,file_path,external_url,duration_minutes',
                'question:question_id,question_text,topic_tag',
            ])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // Attach the most recent attempt_id where the student got a question with this topic_tag wrong.
        // The student dialog uses this to load the full attempt and show all Q&A in context.
        $remediations->each(function ($rem) use ($studentId) {
            $topicTag = $rem->question?->topic_tag;
            $rem->attempt_id = $topicTag
                ? DB::table('student_answers as sa')
                    ->join('quiz_attempts as qa', 'sa.attempt_id', '=', 'qa.attempt_id')
                    ->join('questions as q', 'sa.question_id', '=', 'q.question_id')
                    ->where('qa.student_id', $studentId)
                    ->where('sa.is_correct', false)
                    ->where('q.topic_tag', $topicTag)
                    ->orderByDesc('qa.submitted_at')
                    ->value('qa.attempt_id')
                : null;
        });

        return response()->json($remediations);
    }

    public function dismissRemediation(Request $request, int $remediationId): JsonResponse
    {
        $studentId = $request->user()->user_id;

        DB::table('student_remediation_dismissals')->updateOrInsert(
            ['student_id' => $studentId, 'remediation_id' => $remediationId],
            ['created_at' => now()]
        );

        return response()->json(['status' => 'dismissed']);
    }
}
