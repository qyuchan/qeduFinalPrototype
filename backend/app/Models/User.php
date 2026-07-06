<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $primaryKey = 'user_id';
    public    $timestamps  = false;

    protected $fillable = [
        'student_id', 'full_name', 'username', 'email',
        'password_hash', 'role', 'profile_picture', 'is_active',
    ];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'is_active'  => 'boolean',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class, 'user_id', 'user_id');
    }

    public function masteries()
    {
        return $this->hasMany(StudentTopicMastery::class, 'student_id', 'user_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'user_id', 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }
}
