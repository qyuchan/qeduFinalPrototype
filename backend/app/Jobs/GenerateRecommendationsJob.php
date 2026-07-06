<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\Recommendation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateRecommendationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 30;

    public function __construct(
        private int   $userId,
        private int   $topicId,
        private int   $attemptId,
        private array $weakSubtopics = [],
    ) {}

    public function handle(): void
    {
        // Answering the same questions wrong again means the student still needs
        // those materials. Reset all dismissed study_material recommendations for
        // this topic so they resurface; the RS will determine the new ranked set.
        $topicMaterialIds = DB::table('learning_materials')
            ->where('topic_id', $this->topicId)
            ->where('is_active', true)
            ->pluck('material_id');

        if ($topicMaterialIds->isNotEmpty()) {
            Recommendation::where('user_id', $this->userId)
                ->where('recommendation_type', 'study_material')
                ->where('is_dismissed', true)
                ->whereIn('material_id', $topicMaterialIds)
                ->update(['is_dismissed' => false, 'responded_at' => null]);
        }

        $rsUrl = config('services.recommendation_service.url');

        $response = Http::timeout(15)->post("{$rsUrl}/recommend", [
            'user_id'            => $this->userId,
            'topic_id'           => $this->topicId,
            'trigger_attempt_id' => $this->attemptId,
            'weak_subtopics'     => $this->weakSubtopics,
        ]);

        if ($response->failed()) {
            Log::error('RS microservice error', [
                'user_id' => $this->userId,
                'status'  => $response->status(),
                'body'    => $response->body(),
            ]);
            $this->fail(new \RuntimeException("RS service returned {$response->status()}"));
            return;
        }

        $recs = $response->json('recommendations', []);

        if (empty($recs)) {
            return;
        }

        foreach ($recs as $rec) {
            $existing = Recommendation::where([
                'user_id'             => $this->userId,
                'material_id'         => $rec['material_id'],
                'recommendation_type' => 'study_material',
            ])->first();

            if ($existing) {
                // Re-triggering a recommendation (student got same concept wrong again)
                // resets the dismissal: dismiss means "not now", not "never".
                $existing->update([
                    'triggered_by_attempt' => $this->attemptId,
                    'algorithm_used'       => $rec['algorithm_used'],
                    'subtopic_id'          => $rec['subtopic_id'] ?? null,
                    'reason'               => $rec['reason'] ?? null,
                    'confidence_score'     => $rec['confidence_score'] ?? null,
                    'is_dismissed'         => false,
                    'responded_at'         => null,
                ]);
            } else {
                Recommendation::create([
                    'user_id'              => $this->userId,
                    'material_id'          => $rec['material_id'],
                    'triggered_by_attempt' => $this->attemptId,
                    'algorithm_used'       => $rec['algorithm_used'],
                    'recommendation_type'  => 'study_material',
                    'subtopic_id'          => $rec['subtopic_id'] ?? null,
                    'reason'               => $rec['reason'] ?? null,
                    'confidence_score'     => $rec['confidence_score'] ?? null,
                    'is_dismissed'         => false,
                ]);
            }
        }

        Notification::create([
            'user_id'        => $this->userId,
            'title'          => 'New study recommendations ready',
            'message'        => 'Based on your recent quiz, we found ' . count($recs) . ' materials to help you improve.',
            'type'           => 'recommendation',
            'reference_id'   => $this->attemptId,
            'reference_type' => 'quiz_attempt',
        ]);
    }
}
