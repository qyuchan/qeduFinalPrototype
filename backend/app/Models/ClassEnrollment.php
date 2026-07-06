<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassEnrollment extends Model
{
    protected $primaryKey = 'enrollment_id';
    const     CREATED_AT   = 'enrolled_at';
    public    $timestamps  = false;

    protected $fillable = ['class_id', 'student_id', 'status'];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id', 'user_id');
    }

    public function classRoom()
    {
        return $this->belongsTo(ClassRoom::class, 'class_id', 'class_id');
    }
}
