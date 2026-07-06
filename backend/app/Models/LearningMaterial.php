<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LearningMaterial extends Model
{
    protected $primaryKey = 'material_id';
    const     CREATED_AT   = 'created_at';
    const     UPDATED_AT   = 'updated_at';

    protected $fillable = [
        'topic_id', 'uploaded_by', 'title', 'description', 'content_type',
        'file_path', 'external_url', 'difficulty_level', 'tags', 'keywords',
        'subtopic_id', 'duration_minutes', 'view_count', 'is_remedial', 'is_active',
    ];

    protected $casts = [
        'is_remedial' => 'boolean',
        'is_active'   => 'boolean',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) return null;
        return Storage::disk('public')->url($this->file_path);
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id', 'topic_id');
    }

    public function interactionLogs()
    {
        return $this->hasMany(InteractionLog::class, 'material_id', 'material_id');
    }
}
