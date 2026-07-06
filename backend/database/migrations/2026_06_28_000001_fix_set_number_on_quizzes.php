<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Re-assign set_number based on title:
        //   "... Practice Set N" → set_number = N
        //   anything else (e.g. "Matrices: Formative Quiz") → NULL (used for random-mode only)
        DB::statement("
            UPDATE quizzes
            SET set_number = CASE
                WHEN title ~ 'Practice Set [0-9]+'
                THEN CAST(SUBSTRING(title FROM 'Practice Set ([0-9]+)') AS INTEGER)
                ELSE NULL
            END
            WHERE quiz_type = 'formative'
        ");
    }

    public function down(): void
    {
        // Restore sequential numbering per topic
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
};
