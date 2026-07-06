<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlaggedQuestionDismissal extends Model
{
    protected $primaryKey = 'dismissal_id';
    public    $timestamps  = false;

    protected $fillable = [
        'lecturer_id', 'question_id', 'dismissed_at',
    ];

    protected $casts = ['dismissed_at' => 'datetime'];

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id', 'question_id');
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id', 'user_id');
    }
}
