<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $primaryKey = 'topic_id';
    public    $timestamps  = false;
    const     CREATED_AT   = 'created_at';

    protected $fillable = [
        'course_id', 'parent_topic_id', 'topic_name', 'description', 'syllabus',
        'slide_file_path', 'sequence_order', 'difficulty_level', 'estimated_hours', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function children()
    {
        return $this->hasMany(Topic::class, 'parent_topic_id', 'topic_id');
    }

    public function parent()
    {
        return $this->belongsTo(Topic::class, 'parent_topic_id', 'topic_id');
    }

    public function materials()
    {
        return $this->hasMany(LearningMaterial::class, 'topic_id', 'topic_id');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class, 'topic_id', 'topic_id');
    }
}
