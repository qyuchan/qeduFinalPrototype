<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionRemediation extends Model
{
    protected $primaryKey = 'remediation_id';

    protected $fillable = [
        'question_id', 'lecturer_id', 'material_id', 'custom_explanation',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id', 'question_id');
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id', 'user_id');
    }

    public function material()
    {
        return $this->belongsTo(LearningMaterial::class, 'material_id', 'material_id');
    }
}
