<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';
    const     CREATED_AT   = 'created_at';
    const     UPDATED_AT   = null;

    protected $fillable = [
        'user_id', 'type', 'title', 'message',
        'reference_id', 'reference_type', 'is_read',
    ];

    protected $casts = [
        'is_read'    => 'boolean',
        'created_at' => 'datetime',
    ];
}
