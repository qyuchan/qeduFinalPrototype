<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->string('slide_file_path')->nullable()->after('syllabus');
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropColumn('slide_file_path');
        });
    }
};
