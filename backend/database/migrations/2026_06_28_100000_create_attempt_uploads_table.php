<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attempt_uploads', function (Blueprint $table) {
            $table->bigIncrements('upload_id');
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('student_id');
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedInteger('file_size');
            $table->timestamp('uploaded_at')->useCurrent();

            $table->foreign('attempt_id')->references('attempt_id')->on('quiz_attempts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_uploads');
    }
};
