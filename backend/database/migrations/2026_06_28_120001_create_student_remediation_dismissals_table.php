<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_remediation_dismissals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('remediation_id');
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('student_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('remediation_id')->references('remediation_id')->on('question_remediations')->onDelete('cascade');
            $table->unique(['student_id', 'remediation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_remediation_dismissals');
    }
};
