<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    protected $primaryKey = 'recommendation_id';
    const     CREATED_AT   = 'created_at';
    const     UPDATED_AT   = null;

    protected $fillable = [
        'user_id', 'material_id', 'triggered_by_attempt', 'algorithm_used',
        'recommendation_type', 'subtopic_id',
        'reason', 'confidence_score', 'is_accepted', 'is_dismissed', 'responded_at',
    ];

    protected $casts = [
        'is_accepted'  => 'boolean',
        'is_dismissed' => 'boolean',
        'responded_at' => 'datetime',
        'created_at'   => 'datetime',
    ];

    public function material()
    {
        return $this->belongsTo(LearningMaterial::class, 'material_id', 'material_id');
    }
}
