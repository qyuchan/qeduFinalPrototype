<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model
{
    protected $primaryKey = 'option_id';
    public    $timestamps  = false;

    protected $fillable = ['question_id', 'option_text', 'is_correct', 'sequence_order'];

    protected $casts = ['is_correct' => 'boolean'];
}
