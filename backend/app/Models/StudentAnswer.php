<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAnswer extends Model
{
    protected $primaryKey = 'answer_id';
    public    $timestamps  = false;

    protected $fillable = [
        'attempt_id', 'question_id', 'selected_option_id',
        'text_answer', 'is_correct', 'marks_awarded',
    ];

    protected $casts = ['is_correct' => 'boolean'];

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id', 'question_id');
    }
}
