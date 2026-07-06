<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetProgress extends Command
{
    protected $signature   = 'app:reset-progress';
    protected $description = 'Wipe all student & lecturer activity data for a clean test run (keeps users, classes, content, quizzes)';

    public function handle(): int
    {
        if (!$this->confirm('This will DELETE all attempts, answers, mastery, reviews, remediations, recommendations, and notifications. Continue?')) {
            $this->info('Aborted.');
            return 0;
        }

        $this->info('Resetting progress…');

        // Delete in child-first order so FK constraints are respected on any DB driver.
        // Tables that don't exist yet (e.g. from optional migrations) are skipped.
        $steps = [
            // Children of quiz_attempts
            'student_subtopic_completions',
            'attempt_reviews',
            'attempt_uploads',
            // Children of question_remediations
            'student_remediation_dismissals',
            // Remediations themselves
            'question_remediations',
            // quiz_attempts children
            'student_answers',
            // quiz_attempts parent (recommendations has a nullable FK here)
            'quiz_attempts',
            // Remaining activity tables (no circular deps)
            'interaction_logs',
            'student_topic_mastery',
            'recommendations',
            'user_item_matrix',
            'notifications',
        ];

        foreach ($steps as $table) {
            if (!Schema::hasTable($table)) {
                $this->line("  – skipped {$table} (table not found)");
                continue;
            }
            DB::table($table)->delete();
            $this->line("  ✓ cleared {$table}");
        }

        // Reset student profile stats
        DB::table('student_profiles')->update([
            'streak_days'               => 0,
            'total_time_spent_seconds'  => 0,
            'overall_performance_score' => 0,
        ]);
        $this->line('  ✓ reset student_profiles stats');

        $this->newLine();
        $this->info('Done. All progress wiped. Users, classes, and content are untouched.');
        return 0;
    }
}
