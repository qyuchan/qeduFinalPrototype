<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $primaryKey = 'question_id';
    public    $timestamps  = false;

    protected $fillable = [
        'quiz_id', 'question_text', 'question_type', 'marks',
        'difficulty_level', 'topic_tag', 'subtopic_id', 'explanation', 'image_path',
        'sequence_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function options()
    {
        return $this->hasMany(QuestionOption::class, 'question_id', 'question_id')
            ->orderBy('sequence_order');
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id', 'quiz_id');
    }

    public function remediations()
    {
        return $this->hasMany(QuestionRemediation::class, 'question_id', 'question_id');
    }
}
