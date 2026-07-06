<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class AttemptUpload extends Model
{
    protected $primaryKey = 'upload_id';
    public    $timestamps  = false;

    protected $fillable = [
        'attempt_id', 'student_id', 'file_path', 'original_name', 'mime_type', 'file_size', 'uploaded_at',
    ];

    protected $casts = ['uploaded_at' => 'datetime'];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }
}
