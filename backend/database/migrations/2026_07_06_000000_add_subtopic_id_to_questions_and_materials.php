<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'subtopic_id')) {
                $table->string('subtopic_id', 20)->nullable()->after('topic_tag');
            }
        });

        Schema::table('learning_materials', function (Blueprint $table) {
            if (!Schema::hasColumn('learning_materials', 'subtopic_id')) {
                $table->string('subtopic_id', 20)->nullable()->after('keywords');
            }
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'subtopic_id')) {
                $table->dropColumn('subtopic_id');
            }
        });
        Schema::table('learning_materials', function (Blueprint $table) {
            if (Schema::hasColumn('learning_materials', 'subtopic_id')) {
                $table->dropColumn('subtopic_id');
            }
        });
    }
};
