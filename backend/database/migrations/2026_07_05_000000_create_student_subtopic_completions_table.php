<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_subtopic_completions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('student_id');
            $table->string('subtopic_id', 20);   // e.g. "1.1", "2.3"
            $table->unsignedInteger('topic_id');  // FK for easy group-by
            $table->timestamp('completed_at')->useCurrent();
            $table->unique(['student_id', 'subtopic_id']);
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_subtopic_completions');
    }
};
