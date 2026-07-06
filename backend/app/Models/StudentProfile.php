<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    protected $primaryKey = 'profile_id';
    const     CREATED_AT   = 'created_at';
    const     UPDATED_AT   = 'updated_at';

    protected $fillable = [
        'user_id', 'program', 'enrollment_year', 'current_gpa',
        'learning_style', 'overall_performance_score',
        'total_time_spent_seconds', 'streak_days',
    ];
}
