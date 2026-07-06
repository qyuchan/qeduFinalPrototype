<?php

namespace App\Http\Controllers;

use App\Models\InteractionLog;
use App\Models\LearningMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaterialController extends Controller
{
    public function index(int $topicId): JsonResponse
    {
        $materials = LearningMaterial::where('topic_id', $topicId)
            ->where('is_active', true)
            ->where('is_remedial', false)
            ->orderBy('difficulty_level')
            ->orderBy('created_at')
            ->get();

        return response()->json($materials);
    }

    public function logInteraction(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'interaction_type'    => 'required|in:viewed,downloaded,completed,bookmarked,rated',
            'time_spent_seconds'  => 'nullable|integer|min:0',
            'rating'              => 'nullable|integer|min:1|max:5',
        ]);

        LearningMaterial::where('is_active', true)->findOrFail($id);

        InteractionLog::create([
            'user_id'            => $request->user()->user_id,
            'material_id'        => $id,
            'interaction_type'   => $validated['interaction_type'],
            'time_spent_seconds' => $validated['time_spent_seconds'] ?? 0,
            'rating'             => $validated['rating'] ?? null,
        ]);

        if ($validated['interaction_type'] === 'viewed') {
            LearningMaterial::where('material_id', $id)->increment('view_count');
        }

        // Keep user_item_matrix in sync so CF recommendations have data to work with.
        $weights = [
            'viewed'      => 1.0,
            'downloaded'  => 2.0,
            'completed'   => 3.0,
            'bookmarked'  => 1.5,
            'rated'       => (float) ($validated['rating'] ?? 3),
        ];
        $delta = $weights[$validated['interaction_type']] ?? 1.0;

        DB::table('user_item_matrix')->updateOrInsert(
            ['student_id' => $request->user()->user_id, 'material_id' => $id],
            ['implicit_score' => DB::raw("implicit_score + {$delta}"), 'updated_at' => now()]
        );

        return response()->json(['status' => 'logged']);
    }
}
