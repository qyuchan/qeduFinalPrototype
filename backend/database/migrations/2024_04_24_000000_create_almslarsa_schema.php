<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop default Laravel tables: we replace them with our own schema
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        // ── SECTION 1: USER MANAGEMENT ───────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('student_id', 20)->nullable()->unique();
            $table->string('full_name', 100);
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password_hash', 255);
            $table->enum('role', ['student', 'lecturer', 'admin'])->default('student');
            $table->string('profile_picture', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_login')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->increments('token_id');
            $table->unsignedInteger('user_id');
            $table->string('token', 255)->unique();
            $table->dateTime('expires_at');
            $table->boolean('used')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
        });

        // personal_access_tokens is created by Sanctum's own migration: skip if exists
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        // ── SECTION 2: STUDENT PROFILE ───────────────────────────────────────
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->increments('profile_id');
            $table->unsignedInteger('user_id')->unique();
            $table->string('program', 100)->nullable();
            $table->smallInteger('enrollment_year')->nullable();
            $table->decimal('current_gpa', 3, 2)->nullable();
            $table->enum('learning_style', ['visual', 'auditory', 'reading', 'kinesthetic'])->nullable();
            $table->float('overall_performance_score')->default(0);
            $table->integer('total_time_spent_seconds')->default(0);
            $table->integer('streak_days')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
        });

        // ── SECTION 3: COURSE & CLASS MANAGEMENT ─────────────────────────────
        Schema::create('courses', function (Blueprint $table) {
            $table->increments('course_id');
            $table->string('course_code', 20)->unique();
            $table->string('course_name', 150);
            $table->text('description')->nullable();
            $table->tinyInteger('credit_hours')->default(3);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('created_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->increments('class_id');
            $table->unsignedInteger('course_id');
            $table->unsignedInteger('lecturer_id');
            $table->string('class_name', 50);
            $table->enum('semester', ['1', '2', 'short']);
            $table->string('academic_year', 9);
            $table->smallInteger('enrollment_limit')->default(40);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('course_id')->references('course_id')->on('courses')->cascadeOnDelete();
            $table->foreign('lecturer_id')->references('user_id')->on('users')->restrictOnDelete();
        });

        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->increments('enrollment_id');
            $table->unsignedInteger('class_id');
            $table->unsignedInteger('student_id');
            $table->enum('status', ['active', 'withdrawn', 'completed'])->default('active');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->unique(['class_id', 'student_id']);
            $table->foreign('class_id')->references('class_id')->on('classes')->cascadeOnDelete();
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
        });

        // ── SECTION 4: TOPIC HIERARCHY ────────────────────────────────────────
        Schema::create('topics', function (Blueprint $table) {
            $table->increments('topic_id');
            $table->unsignedInteger('course_id');
            $table->unsignedInteger('parent_topic_id')->nullable();
            $table->string('topic_name', 150);
            $table->text('description')->nullable();
            $table->smallInteger('sequence_order')->default(1);
            $table->enum('difficulty_level', ['basic', 'intermediate', 'advanced'])->default('basic');
            $table->decimal('estimated_hours', 4, 1)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('course_id')->references('course_id')->on('courses')->cascadeOnDelete();
            $table->foreign('parent_topic_id')->references('topic_id')->on('topics')->nullOnDelete();
        });

        Schema::create('topic_prerequisites', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('topic_id');
            $table->unsignedInteger('required_topic_id');
            $table->unique(['topic_id', 'required_topic_id']);
            $table->foreign('topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
            $table->foreign('required_topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
        });

        // ── SECTION 5: LEARNING MATERIALS ────────────────────────────────────
        Schema::create('learning_materials', function (Blueprint $table) {
            $table->increments('material_id');
            $table->unsignedInteger('topic_id');
            $table->unsignedInteger('uploaded_by');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->enum('content_type', ['pdf', 'video', 'article', 'exercise', 'example', 'summary']);
            $table->string('file_path', 500)->nullable();
            $table->string('external_url', 500)->nullable();
            $table->enum('difficulty_level', ['basic', 'intermediate', 'advanced'])->default('basic');
            $table->text('tags')->nullable();
            $table->text('keywords')->nullable();
            $table->smallInteger('duration_minutes')->nullable();
            $table->integer('view_count')->default(0);
            $table->boolean('is_remedial')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->foreign('topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('user_id')->on('users')->restrictOnDelete();
        });

        // ── SECTION 6: QUIZ & ASSESSMENT ─────────────────────────────────────
        Schema::create('quizzes', function (Blueprint $table) {
            $table->increments('quiz_id');
            $table->unsignedInteger('topic_id');
            $table->unsignedInteger('class_id')->nullable();
            $table->unsignedInteger('created_by');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->enum('quiz_type', ['diagnostic', 'formative', 'summative', 'remedial'])->default('formative');
            $table->smallInteger('total_marks');
            $table->tinyInteger('passing_threshold')->default(50);
            $table->smallInteger('time_limit_minutes')->nullable();
            $table->tinyInteger('max_attempts')->default(3);
            $table->boolean('shuffle_questions')->default(true);
            $table->boolean('shuffle_options')->default(true);
            $table->dateTime('available_from')->nullable();
            $table->dateTime('available_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
            $table->foreign('class_id')->references('class_id')->on('classes')->nullOnDelete();
            $table->foreign('created_by')->references('user_id')->on('users')->restrictOnDelete();
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->increments('question_id');
            $table->unsignedInteger('quiz_id');
            $table->text('question_text');
            $table->enum('question_type', ['mcq', 'true_false', 'short_answer', 'structural'])->default('mcq');
            $table->tinyInteger('marks')->default(1);
            $table->enum('difficulty_level', ['easy', 'medium', 'hard'])->default('medium');
            $table->string('topic_tag', 100)->nullable();
            $table->text('explanation')->nullable();
            $table->string('image_path', 255)->nullable();
            $table->smallInteger('sequence_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('quiz_id')->references('quiz_id')->on('quizzes')->cascadeOnDelete();
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->increments('option_id');
            $table->unsignedInteger('question_id');
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->tinyInteger('sequence_order')->default(1);
            $table->foreign('question_id')->references('question_id')->on('questions')->cascadeOnDelete();
        });

        // ── SECTION 7: QUIZ ATTEMPTS & STUDENT ANSWERS ───────────────────────
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->increments('attempt_id');
            $table->unsignedInteger('quiz_id');
            $table->unsignedInteger('student_id');
            $table->tinyInteger('attempt_number')->default(1);
            $table->decimal('score', 5, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->enum('pass_status', ['pass', 'fail'])->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->dateTime('submitted_at')->nullable();
            $table->integer('time_taken_seconds')->nullable();
            $table->unique(['quiz_id', 'student_id', 'attempt_number']);
            $table->foreign('quiz_id')->references('quiz_id')->on('quizzes')->cascadeOnDelete();
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
        });

        Schema::create('student_answers', function (Blueprint $table) {
            $table->increments('answer_id');
            $table->unsignedInteger('attempt_id');
            $table->unsignedInteger('question_id');
            $table->unsignedInteger('selected_option_id')->nullable();
            $table->text('text_answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('marks_awarded', 4, 2)->default(0);
            $table->timestamp('answered_at')->useCurrent();
            $table->foreign('attempt_id')->references('attempt_id')->on('quiz_attempts')->cascadeOnDelete();
            $table->foreign('question_id')->references('question_id')->on('questions')->cascadeOnDelete();
            $table->foreign('selected_option_id')->references('option_id')->on('question_options')->nullOnDelete();
        });

        // ── SECTION 8: INTERACTION LOG ────────────────────────────────────────
        Schema::create('interaction_logs', function (Blueprint $table) {
            $table->increments('log_id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('material_id');
            $table->enum('interaction_type', ['viewed', 'downloaded', 'completed', 'bookmarked', 'rated']);
            $table->integer('time_spent_seconds')->default(0);
            $table->tinyInteger('rating')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('material_id')->references('material_id')->on('learning_materials')->cascadeOnDelete();
        });

        // ── SECTION 9: RECOMMENDATION ENGINE ─────────────────────────────────
        Schema::create('student_topic_mastery', function (Blueprint $table) {
            $table->increments('mastery_id');
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('topic_id');
            $table->enum('mastery_level', ['not_started', 'learning', 'practicing', 'mastered'])->default('not_started');
            $table->decimal('mastery_score', 5, 2)->default(0);
            $table->tinyInteger('quiz_attempts_count')->default(0);
            $table->decimal('best_score', 5, 2)->default(0);
            $table->dateTime('last_attempt_at')->nullable();
            $table->boolean('is_weak')->default(false);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['student_id', 'topic_id']);
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('topic_id')->references('topic_id')->on('topics')->cascadeOnDelete();
        });

        Schema::create('recommendations', function (Blueprint $table) {
            $table->increments('recommendation_id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('material_id');
            $table->unsignedInteger('triggered_by_attempt')->nullable();
            $table->enum('algorithm_used', ['content_based', 'collaborative', 'hybrid', 'cold_start']);
            $table->string('reason', 255)->nullable();
            $table->float('confidence_score')->nullable();
            $table->boolean('is_accepted')->nullable();
            $table->boolean('is_dismissed')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->dateTime('responded_at')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('material_id')->references('material_id')->on('learning_materials')->cascadeOnDelete();
            $table->foreign('triggered_by_attempt')->references('attempt_id')->on('quiz_attempts')->nullOnDelete();
        });

        Schema::create('material_similarity', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('material_a_id');
            $table->unsignedInteger('material_b_id');
            $table->float('similarity_score');
            $table->timestamp('computed_at')->useCurrent();
            $table->unique(['material_a_id', 'material_b_id']);
            $table->foreign('material_a_id')->references('material_id')->on('learning_materials')->cascadeOnDelete();
            $table->foreign('material_b_id')->references('material_id')->on('learning_materials')->cascadeOnDelete();
        });

        Schema::create('user_item_matrix', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('material_id');
            $table->float('implicit_score')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->unique(['student_id', 'material_id']);
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('material_id')->references('material_id')->on('learning_materials')->cascadeOnDelete();
        });

        // ── SECTION 10: NOTIFICATIONS ─────────────────────────────────────────
        Schema::create('announcements', function (Blueprint $table) {
            $table->increments('announcement_id');
            $table->unsignedInteger('class_id')->nullable();
            $table->unsignedInteger('posted_by');
            $table->string('title', 200);
            $table->text('content');
            $table->boolean('is_pinned')->default(false);
            $table->dateTime('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('class_id')->references('class_id')->on('classes')->cascadeOnDelete();
            $table->foreign('posted_by')->references('user_id')->on('users')->cascadeOnDelete();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('notification_id');
            $table->unsignedInteger('user_id');
            $table->enum('type', ['recommendation', 'quiz_available', 'quiz_result', 'announcement', 'achievement', 'reminder']);
            $table->string('title', 200);
            $table->text('message');
            $table->unsignedInteger('reference_id')->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
        });

        // ── SECTION 11: ACHIEVEMENTS ──────────────────────────────────────────
        Schema::create('achievements', function (Blueprint $table) {
            $table->increments('achievement_id');
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->string('badge_icon', 255)->nullable();
            $table->enum('criteria_type', ['quiz_pass_streak', 'topic_mastered', 'materials_viewed', 'score_improvement', 'quiz_perfect']);
            $table->integer('criteria_value');
            $table->smallInteger('points')->default(0);
        });

        Schema::create('student_achievements', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('student_id');
            $table->unsignedInteger('achievement_id');
            $table->timestamp('earned_at')->useCurrent();
            $table->unique(['student_id', 'achievement_id']);
            $table->foreign('student_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('achievement_id')->references('achievement_id')->on('achievements')->cascadeOnDelete();
        });

        // ── SECTION 12: INDEXES ───────────────────────────────────────────────
        Schema::table('users',             fn($t) => $t->index('role'));
        Schema::table('topics',            fn($t) => $t->index(['course_id', 'sequence_order']));
        Schema::table('learning_materials', fn($t) => $t->index(['topic_id', 'difficulty_level']));
        Schema::table('quizzes',           fn($t) => $t->index(['topic_id', 'quiz_type']));
        Schema::table('quiz_attempts',     fn($t) => $t->index(['student_id', 'quiz_id']));
        Schema::table('interaction_logs',  fn($t) => $t->index(['user_id', 'material_id']));
        Schema::table('student_topic_mastery', fn($t) => $t->index(['student_id', 'is_weak']));
        Schema::table('recommendations',   fn($t) => $t->index(['user_id', 'is_dismissed']));
    }

    public function down(): void
    {
        $tables = [
            'student_achievements', 'achievements',
            'notifications', 'announcements',
            'user_item_matrix', 'material_similarity', 'recommendations', 'student_topic_mastery',
            'interaction_logs',
            'student_answers', 'quiz_attempts',
            'question_options', 'questions', 'quizzes',
            'learning_materials',
            'topic_prerequisites', 'topics',
            'class_enrollments', 'classes', 'courses',
            'student_profiles',
            'personal_access_tokens', 'password_reset_tokens', 'users',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
