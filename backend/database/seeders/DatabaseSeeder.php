<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AlmsarsaSeeder::class);
        $this->call(SubtopicContentSeeder::class);
    }
}
