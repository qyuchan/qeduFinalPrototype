<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\LecturerController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Topics
    Route::get('/topics',                                    [QuizController::class, 'topics']);
    Route::get('/topics/{topicId}/subtopics',                [QuizController::class, 'topicSubtopics']);

    // Quiz
    Route::get('/topics/{topicId}/quiz',              [QuizController::class, 'fetch']);
    Route::get('/topics/{topicId}/sets',              [QuizController::class, 'availableSets']);
    Route::post('/quiz/{quizId}/submit',              [QuizController::class, 'submit']);
    Route::get('/quiz/attempt/{attemptId}/result',    [QuizController::class, 'result']);
    Route::post('/quiz/attempt/{attemptId}/upload',   [QuizController::class, 'uploadWork']);

    // Recommendations
    Route::get('/recommendations',                    [RecommendationController::class, 'index']);
    Route::patch('/recommendations/{id}/accept',      [RecommendationController::class, 'accept']);
    Route::patch('/recommendations/{id}/dismiss',     [RecommendationController::class, 'dismiss']);

    // Materials
    Route::get('/topics/{topicId}/materials',         [MaterialController::class, 'index']);
    Route::post('/materials/{id}/interact',           [MaterialController::class, 'logInteraction']);

    // Mastery
    Route::get('/mastery',                            [QuizController::class, 'masteryOverview']);

    // Course (subtopic) completion — DB-backed progress
    Route::get('/subtopic-progress',                  [QuizController::class, 'getSubtopicProgress']);
    Route::post('/subtopic-progress',                 [QuizController::class, 'markSubtopicComplete']);
    Route::delete('/subtopic-progress/{subtopicId}',  [QuizController::class, 'markSubtopicIncomplete'])->where('subtopicId', '.+');

    // Lecturer remediations for student dashboard
    Route::get('/lecturer-remediations',                    [RecommendationController::class, 'lecturerRemediations']);
    Route::post('/lecturer-remediations/{id}/dismiss',      [RecommendationController::class, 'dismissRemediation']);
    Route::get('/lecturer-reviews',                         [RecommendationController::class, 'lecturerReviews']);
    Route::patch('/reviews/{reviewId}/complete',            [RecommendationController::class, 'completeReview']);

    // Lecturer panel
    Route::prefix('lecturer')->group(function () {
        Route::get('/topics',                                           [LecturerController::class, 'topics']);
        Route::post('/topics',                                          [LecturerController::class, 'storeTopic']);
        Route::patch('/topics/{id}',                                    [LecturerController::class, 'updateTopic']);
        Route::get('/topics/hidden',                                    [LecturerController::class, 'hiddenTopics']);
        Route::delete('/topics/{id}',                                   [LecturerController::class, 'destroyTopic']);
        Route::patch('/topics/{id}/restore',                            [LecturerController::class, 'restoreTopic']);
        Route::get('/topics/{id}/subtopics',                            [LecturerController::class, 'topicSubtopics']);
        Route::post('/topics/{parentId}/subtopics',                     [LecturerController::class, 'storeSubtopic']);
        Route::patch('/topics/{parentId}/subtopics/{id}',               [LecturerController::class, 'updateSubtopic']);
        Route::delete('/topics/{parentId}/subtopics/{id}',              [LecturerController::class, 'destroySubtopic']);
        Route::post('/topics/{parentId}/subtopics/{id}/slide',          [LecturerController::class, 'uploadSubtopicSlide']);
        Route::delete('/topics/{parentId}/subtopics/{id}/slide',        [LecturerController::class, 'deleteSubtopicSlide']);
        Route::post('/questions/{questionId}/figure',                   [LecturerController::class, 'uploadQuestionFigure']);
        Route::get('/mastery-overview',                          [LecturerController::class, 'masteryOverview']);
        Route::get('/students/search',                           [LecturerController::class, 'searchStudents']);
        Route::get('/students/{studentId}/mastery',                                    [LecturerController::class, 'studentMastery']);
        Route::get('/students/{studentId}/attempts',                                   [LecturerController::class, 'studentAttempts']);
        Route::get('/students/{studentId}/attempts/{attemptId}/wrong-questions',       [LecturerController::class, 'attemptWrongQuestions']);
        Route::get('/attempts/{attemptId}/review',               [LecturerController::class, 'getReview']);
        Route::post('/attempts/{attemptId}/review',              [LecturerController::class, 'storeReview']);

        // Classes
        Route::get('/classes',                                   [LecturerController::class, 'classes']);
        Route::post('/classes',                                  [LecturerController::class, 'storeClass']);
        Route::patch('/classes/{id}',                            [LecturerController::class, 'updateClass']);
        Route::delete('/classes/{id}',                           [LecturerController::class, 'destroyClass']);

        // Enrollment
        Route::get('/classes/{id}/students',                     [LecturerController::class, 'classStudents']);
        Route::post('/classes/{id}/students',                    [LecturerController::class, 'enrollStudent']);
        Route::delete('/classes/{classId}/students/{userId}',    [LecturerController::class, 'unenrollStudent']);

        // Materials
        Route::get('/materials',                                 [LecturerController::class, 'materials']);
        Route::post('/materials',                                [LecturerController::class, 'storeMaterial']);
        Route::patch('/materials/{id}',                          [LecturerController::class, 'updateMaterial']);
        Route::delete('/materials/{id}',                         [LecturerController::class, 'destroyMaterial']);

        // Quizzes
        Route::get('/quizzes',                                   [LecturerController::class, 'quizzes']);
        Route::post('/quizzes',                                  [LecturerController::class, 'storeQuiz']);
        Route::get('/quizzes/{id}',                              [LecturerController::class, 'showQuiz']);
        Route::patch('/quizzes/{id}',                            [LecturerController::class, 'updateQuiz']);
        Route::delete('/quizzes/{id}',                           [LecturerController::class, 'destroyQuiz']);
        Route::get('/question-tags',                             [LecturerController::class, 'questionTags']);
        Route::delete('/questions/{questionId}/figure',          [LecturerController::class, 'deleteQuestionFigure']);

        // Flagged questions & remediations
        Route::get('/flagged-questions',                         [LecturerController::class, 'flaggedQuestions']);
        Route::post('/questions/{id}/remediations',              [LecturerController::class, 'storeRemediation']);
        Route::delete('/remediations/{id}',                      [LecturerController::class, 'destroyRemediation']);
    });
});
