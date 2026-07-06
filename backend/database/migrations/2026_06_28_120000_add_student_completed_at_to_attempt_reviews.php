<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempt_reviews', function (Blueprint $table) {
            $table->timestamp('student_completed_at')->nullable()->after('file_size');
        });
    }

    public function down(): void
    {
        Schema::table('attempt_reviews', function (Blueprint $table) {
            $table->dropColumn('student_completed_at');
        });
    }
};
