<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InteractionLog extends Model
{
    protected $primaryKey = 'log_id';
    const     CREATED_AT   = 'created_at';
    const     UPDATED_AT   = null;

    protected $fillable = [
        'user_id', 'material_id', 'interaction_type',
        'time_spent_seconds', 'rating',
    ];

    protected $casts = ['created_at' => 'datetime'];
}
