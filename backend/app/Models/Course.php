<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $primaryKey = 'course_id';
    const     CREATED_AT   = 'created_at';
    public    $timestamps  = false;

    protected $fillable = [
        'course_code', 'course_name', 'description',
        'credit_hours', 'is_active', 'created_by',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function classes()
    {
        return $this->hasMany(ClassRoom::class, 'course_id', 'course_id');
    }

    public function topics()
    {
        return $this->hasMany(Topic::class, 'course_id', 'course_id');
    }
}
