<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attempt_reviews', function (Blueprint $table) {
            $table->bigIncrements('review_id');
            $table->unsignedBigInteger('attempt_id');
            $table->unsignedBigInteger('lecturer_id');
            $table->text('comment')->nullable();
            $table->string('file_path')->nullable();
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->timestamps();

            $table->foreign('attempt_id')
                  ->references('attempt_id')->on('quiz_attempts')
                  ->onDelete('cascade');

            $table->unique(['attempt_id', 'lecturer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_reviews');
    }
};
