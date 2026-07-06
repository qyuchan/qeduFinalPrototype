<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class AttemptReview extends Model
{
    protected $primaryKey = 'review_id';

    protected $fillable = [
        'attempt_id', 'lecturer_id', 'comment',
        'file_path', 'original_name', 'mime_type', 'file_size',
        'student_completed_at',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) return null;
        return Storage::disk('public')->url($this->file_path);
    }

    public function attempt()
    {
        return $this->belongsTo(QuizAttempt::class, 'attempt_id', 'attempt_id');
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id', 'user_id');
    }
}
