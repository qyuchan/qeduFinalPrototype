<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_semester_check');
        DB::statement("ALTER TABLE classes ADD CONSTRAINT classes_semester_check CHECK (semester IN ('1', '2', '3', 'short'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_semester_check');
        DB::statement("ALTER TABLE classes ADD CONSTRAINT classes_semester_check CHECK (semester IN ('1', '2', 'short'))");
    }
};
