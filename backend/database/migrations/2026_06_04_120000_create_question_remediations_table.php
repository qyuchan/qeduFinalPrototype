<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_remediations', function (Blueprint $table) {
            $table->increments('remediation_id');
            $table->unsignedInteger('question_id');
            $table->unsignedInteger('lecturer_id');
            $table->unsignedInteger('material_id')->nullable();
            $table->text('custom_explanation')->nullable();
            $table->timestamps();

            $table->foreign('question_id')->references('question_id')->on('questions')->cascadeOnDelete();
            $table->foreign('lecturer_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('material_id')->references('material_id')->on('learning_materials')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_remediations');
    }
};
