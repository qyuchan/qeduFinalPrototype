<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('achievements');
    }

    public function down(): void
    {
        // Achievements feature removed: no rollback
    }
};
