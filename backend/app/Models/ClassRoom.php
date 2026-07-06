<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassRoom extends Model
{
    protected $table      = 'classes';
    protected $primaryKey = 'class_id';
    const     CREATED_AT   = 'created_at';
    public    $timestamps  = false;

    protected $fillable = [
        'course_id', 'lecturer_id', 'class_name',
        'semester', 'academic_year', 'enrollment_limit', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'course_id');
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id', 'user_id');
    }

    public function enrollments()
    {
        return $this->hasMany(ClassEnrollment::class, 'class_id', 'class_id')
            ->where('status', 'active');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class, 'class_id', 'class_id');
    }
}
