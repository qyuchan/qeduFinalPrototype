<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->unsignedTinyInteger('set_number')->nullable()->after('quiz_type');
        });

        // Backfill: rank each quiz within its (topic_id, quiz_type) group by quiz_id ascending
        DB::statement("
            UPDATE quizzes
            SET set_number = ranked.rn
            FROM (
                SELECT quiz_id,
                       ROW_NUMBER() OVER (PARTITION BY topic_id, quiz_type ORDER BY quiz_id) AS rn
                FROM quizzes
            ) ranked
            WHERE quizzes.quiz_id = ranked.quiz_id
        ");
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('set_number');
        });
    }
};
