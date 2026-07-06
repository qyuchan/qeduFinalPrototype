<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTopicMastery extends Model
{
    protected $table      = 'student_topic_mastery';
    protected $primaryKey = 'mastery_id';
    public    $timestamps  = false;

    protected $fillable = [
        'student_id', 'topic_id', 'mastery_level', 'mastery_score',
        'quiz_attempts_count', 'best_score', 'last_attempt_at', 'is_weak',
    ];

    protected $casts = [
        'is_weak'        => 'boolean',
        'last_attempt_at'=> 'datetime',
        'updated_at'     => 'datetime',
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id', 'topic_id');
    }
}
