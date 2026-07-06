<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flagged_question_dismissals', function (Blueprint $table) {
            $table->increments('dismissal_id');
            $table->unsignedInteger('lecturer_id');
            $table->unsignedInteger('question_id');
            $table->timestamp('dismissed_at')->useCurrent();

            $table->unique(['lecturer_id', 'question_id']);
            $table->foreign('lecturer_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('question_id')->references('question_id')->on('questions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flagged_question_dismissals');
    }
};
