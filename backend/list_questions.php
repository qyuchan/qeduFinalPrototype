<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$questions = DB::select("
    SELECT q.question_id, q.quiz_id, q.question_text, q.topic_tag, qz.topic_id,
           t.topic_name
    FROM questions q
    JOIN quizzes qz ON q.quiz_id = qz.quiz_id
    JOIN topics t ON qz.topic_id = t.topic_id
    ORDER BY t.topic_name, q.quiz_id, q.question_id
");

foreach ($questions as $q) {
    echo "ID:{$q->question_id} | Quiz:{$q->quiz_id} | Topic:{$q->topic_name} | Tag:{$q->topic_tag}\n";
    echo "  Q: " . substr($q->question_text, 0, 100) . "\n\n";
}

echo "Total: " . count($questions) . " questions\n";
