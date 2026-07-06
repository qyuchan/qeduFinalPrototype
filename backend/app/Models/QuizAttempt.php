<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $primaryKey = 'attempt_id';
    public    $timestamps  = false;

    protected $fillable = [
        'quiz_id', 'student_id', 'attempt_number', 'score', 'percentage',
        'pass_status', 'started_at', 'submitted_at', 'time_taken_seconds',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function studentAnswers()
    {
        return $this->hasMany(StudentAnswer::class, 'attempt_id', 'attempt_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'triggered_by_attempt', 'attempt_id');
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id', 'quiz_id');
    }

    public function uploads()
    {
        return $this->hasMany(AttemptUpload::class, 'attempt_id', 'attempt_id');
    }

    public function reviews()
    {
        return $this->hasMany(AttemptReview::class, 'attempt_id', 'attempt_id');
    }
}
