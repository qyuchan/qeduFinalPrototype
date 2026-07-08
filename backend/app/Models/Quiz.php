<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $primaryKey = 'quiz_id';
    public    $timestamps  = false;

    protected $fillable = [
        'topic_id', 'class_id', 'created_by', 'title', 'description',
        'quiz_type', 'set_number', 'total_marks', 'passing_threshold', 'time_limit_minutes',
        'max_attempts', 'shuffle_questions', 'shuffle_options',
        'available_from', 'available_until', 'is_active',
    ];

    protected $casts = [
        'shuffle_questions' => 'boolean',
        'shuffle_options'   => 'boolean',
        'is_active'         => 'boolean',
        'available_from'    => 'datetime',
        'available_until'   => 'datetime',
    ];

    public function questions()
    {
        return $this->hasMany(Question::class, 'quiz_id', 'quiz_id')
            ->where('is_active', true)
            ->orderBy('sequence_order');
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id', 'topic_id');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class, 'quiz_id', 'quiz_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}
