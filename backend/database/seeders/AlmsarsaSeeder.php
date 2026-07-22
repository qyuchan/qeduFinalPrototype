<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Quiz;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AlmsarsaSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Accounts ───────────────────────────────────────────────────────
        $lecturer = User::firstOrCreate(
            ['email' => 'lecturer@test.com'],
            [
                'full_name'     => 'Dr. Nurul Hijja',
                'username'      => 'lecturer_test',
                'password_hash' => Hash::make('password123'),
                'role'          => 'lecturer',
                'is_active'     => true,
            ]
        );

        // Ensure real student has a profile (idempotent)
        $student = User::where('email', '2023276758@student.uitm.edu.my')->first();
        if ($student) {
            \App\Models\StudentProfile::firstOrCreate(
                ['user_id' => $student->user_id],
                [
                    'program'                   => 'Bachelor of CS (Hons.) Multimedia Computing',
                    'enrollment_year'           => 2023,
                    'overall_performance_score' => 0,
                    'total_time_spent_seconds'  => 0,
                    'streak_days'               => 0,
                ]
            );
        }

        // ── 2. Course ─────────────────────────────────────────────────────────
        $course = Course::firstOrCreate(
            ['course_code' => 'MAT423'],
            [
                'course_name' => 'Linear Algebra',
                'description' => 'Matrices, Determinants, and Systems of Linear Equations',
                'credit_hours' => 3,
                'is_active'   => true,
                'created_by'  => $lecturer->user_id,
            ]
        );

        // ── 3. Topics ─────────────────────────────────────────────────────────
        $topicsData = [
            [
                'topic_name'       => 'Matrices',
                'description'      => 'Matrix operations, types, and properties including addition, multiplication, and transpose',
                'sequence_order'   => 1,
                'difficulty_level' => 'basic',
                'estimated_hours'  => 6.0,
            ],
            [
                'topic_name'       => 'Determinants',
                'description'      => 'Computing determinants of 2x2 and 3x3 matrices, cofactor expansion, and properties',
                'sequence_order'   => 2,
                'difficulty_level' => 'intermediate',
                'estimated_hours'  => 5.0,
            ],
            [
                'topic_name'       => 'Systems of Linear Equations',
                'description'      => 'Solving systems using Gaussian elimination, Cramer\'s rule, and matrix methods',
                'sequence_order'   => 3,
                'difficulty_level' => 'intermediate',
                'estimated_hours'  => 7.0,
            ],
        ];

        $topics = [];
        foreach ($topicsData as $data) {
            $topics[] = Topic::firstOrCreate(
                ['topic_name' => $data['topic_name'], 'course_id' => $course->course_id],
                array_merge($data, ['course_id' => $course->course_id, 'is_active' => true])
            );
        }

        [$matrices, $determinants, $systems] = $topics;

        // ── 3b. Topic prerequisites (chain matches sequence_order above) ──────
        // Lets CBF pull in the prerequisite topic's materials alongside the
        // current one when a student is struggling, not just same-topic content.
        foreach ([
            [$determinants->topic_id, $matrices->topic_id],
            [$systems->topic_id,      $determinants->topic_id],
        ] as [$topicId, $requiredTopicId]) {
            DB::table('topic_prerequisites')->updateOrInsert(
                ['topic_id' => $topicId, 'required_topic_id' => $requiredTopicId]
            );
        }

        // ── 4. Quizzes + Questions (10 practice sets per topic) ───────────────
        // Matrices
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz2());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz3());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz4());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz5());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz6());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz7());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz8());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz9());
        $this->seedQuiz($lecturer->user_id, $matrices->topic_id, $this->matricesQuiz10());
        // Determinants
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz2());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz3());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz4());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz5());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz6());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz7());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz8());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz9());
        $this->seedQuiz($lecturer->user_id, $determinants->topic_id, $this->determinantsQuiz10());
        // Systems
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz2());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz3());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz4());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz5());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz6());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz7());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz8());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz9());
        $this->seedQuiz($lecturer->user_id, $systems->topic_id, $this->systemsQuiz10());

        // ── 5. Materials ──────────────────────────────────────────────────────
        $this->seedMaterials($lecturer->user_id, $matrices->topic_id,     $this->matricesMaterials());
        $this->seedMaterials($lecturer->user_id, $determinants->topic_id, $this->determinantsMaterials());
        $this->seedMaterials($lecturer->user_id, $systems->topic_id,      $this->systemsMaterials());
    }

    // ── Quiz seeding helper ───────────────────────────────────────────────────

    private function seedQuiz(int $lecturerId, int $topicId, array $data): void
    {
        $exists = Quiz::where('topic_id', $topicId)->where('title', $data['title'])->exists();
        if ($exists) return;

        $quiz = Quiz::create([
            'topic_id'          => $topicId,
            'created_by'        => $lecturerId,
            'title'             => $data['title'],
            'description'       => $data['description'],
            'quiz_type'         => 'formative',
            'total_marks'       => count($data['questions']),
            'passing_threshold' => 60,
            'shuffle_questions' => true,
            'shuffle_options'   => true,
            'is_active'         => true,
        ]);

        foreach ($data['questions'] as $i => $q) {
            $question = Question::create([
                'quiz_id'          => $quiz->quiz_id,
                'question_text'    => $q['text'],
                'question_type'    => 'mcq',
                'marks'            => 1,
                'difficulty_level' => $q['difficulty'],
                'topic_tag'        => $q['tag'] ?? null,
                'explanation'      => $q['explanation'] ?? null,
                'sequence_order'   => $i + 1,
                'is_active'        => true,
            ]);

            foreach ($q['options'] as $j => $opt) {
                QuestionOption::create([
                    'question_id'    => $question->question_id,
                    'option_text'    => $opt['text'],
                    'is_correct'     => $opt['correct'],
                    'sequence_order' => $j + 1,
                ]);
            }
        }
    }

    // ── Materials seeding helper ──────────────────────────────────────────────

    private function seedMaterials(int $lecturerId, int $topicId, array $items): void
    {
        foreach ($items as $item) {
            LearningMaterial::updateOrCreate(
                ['topic_id' => $topicId, 'title' => $item['title']],
                array_merge($item, [
                    'topic_id'    => $topicId,
                    'uploaded_by' => $lecturerId,
                    'is_active'   => true,
                    'view_count'  => 0,
                ])
            );
        }
    }

    // ── Quiz data ─────────────────────────────────────────────────────────────

    private function matricesQuiz(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 1',
            'description' => 'Test your understanding of matrix operations and properties',
            'questions'   => [
                [
                    'text'        => 'What is the result of adding two matrices A and B if A = [[1,2],[3,4]] and B = [[5,6],[7,8]]?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Matrix Addition',
                    'explanation' => 'Matrix addition is performed element-wise. A+B = [[1+5, 2+6],[3+7, 4+8]] = [[6,8],[10,12]].',
                    'options'     => [
                        ['text' => '[[6,8],[10,12]]',  'correct' => true],
                        ['text' => '[[5,12],[21,32]]', 'correct' => false],
                        ['text' => '[[6,8],[11,12]]',  'correct' => false],
                        ['text' => '[[4,4],[4,4]]',    'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the transpose of matrix A = [[1,2,3],[4,5,6]]?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Transpose',
                    'explanation' => 'Transposing a matrix flips rows and columns. The transpose of a 2×3 matrix is a 3×2 matrix.',
                    'options'     => [
                        ['text' => '[[1,4],[2,5],[3,6]]', 'correct' => true],
                        ['text' => '[[1,2,3],[4,5,6]]',   'correct' => false],
                        ['text' => '[[6,5,4],[3,2,1]]',   'correct' => false],
                        ['text' => '[[1,2],[3,4],[5,6]]',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Which of the following is true about matrix multiplication?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Matrix Multiplication',
                    'explanation' => 'Matrix multiplication is generally not commutative: AB ≠ BA in most cases.',
                    'options'     => [
                        ['text' => 'It is generally not commutative (AB ≠ BA)',     'correct' => true],
                        ['text' => 'It is always commutative (AB = BA)',             'correct' => false],
                        ['text' => 'The result is always a square matrix',           'correct' => false],
                        ['text' => 'Two matrices of any size can always be multiplied', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the identity matrix for 3×3 matrices?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Special Matrices',
                    'explanation' => 'The 3×3 identity matrix has 1s on the main diagonal and 0s elsewhere.',
                    'options'     => [
                        ['text' => '[[1,0,0],[0,1,0],[0,0,1]]', 'correct' => true],
                        ['text' => '[[0,0,0],[0,0,0],[0,0,0]]', 'correct' => false],
                        ['text' => '[[1,1,1],[1,1,1],[1,1,1]]', 'correct' => false],
                        ['text' => '[[1,0,0],[1,0,0],[1,0,0]]', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'If A is a 2×3 matrix and B is a 3×4 matrix, what are the dimensions of AB?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Matrix Multiplication',
                    'explanation' => 'For AB to exist, the number of columns of A must equal the number of rows of B. The result has dimensions (rows of A) × (columns of B) = 2×4.',
                    'options'     => [
                        ['text' => '2×4', 'correct' => true],
                        ['text' => '3×3', 'correct' => false],
                        ['text' => '2×3', 'correct' => false],
                        ['text' => '3×4', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is a symmetric matrix?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Matrix Types',
                    'explanation' => 'A matrix A is symmetric if A = A^T, meaning the element at row i, column j equals the element at row j, column i.',
                    'options'     => [
                        ['text' => 'A matrix where A = A^T',              'correct' => true],
                        ['text' => 'A matrix where all elements are equal', 'correct' => false],
                        ['text' => 'A matrix where A = -A^T',              'correct' => false],
                        ['text' => 'A matrix with equal rows and columns',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Which operation is NOT valid: A = [[1,2],[3,4]], B = [[1,2,3],[4,5,6]]?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Matrix Operations',
                    'explanation' => 'Matrix addition requires both matrices to have the same dimensions. A is 2×2 and B is 2×3, so A+B is undefined.',
                    'options'     => [
                        ['text' => 'A + B', 'correct' => true],
                        ['text' => 'A × B', 'correct' => false],
                        ['text' => 'A^T',   'correct' => false],
                        ['text' => '2A',    'correct' => false],
                    ],
                ],
                [
                    'text'        => 'If A is an n×n matrix and A² = A, then A is called a:',
                    'difficulty'  => 'hard',
                    'tag'         => 'Special Matrices',
                    'explanation' => 'An idempotent matrix satisfies A² = A. The projection matrices are common examples.',
                    'options'     => [
                        ['text' => 'Idempotent matrix',  'correct' => true],
                        ['text' => 'Nilpotent matrix',   'correct' => false],
                        ['text' => 'Involutory matrix',  'correct' => false],
                        ['text' => 'Orthogonal matrix',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the scalar multiple 3A if A = [[2,1],[0,4]]?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Scalar Multiplication',
                    'explanation' => 'Scalar multiplication multiplies every element by the scalar: 3×[[2,1],[0,4]] = [[6,3],[0,12]].',
                    'options'     => [
                        ['text' => '[[6,3],[0,12]]', 'correct' => true],
                        ['text' => '[[5,4],[3,7]]',  'correct' => false],
                        ['text' => '[[6,3],[0,4]]',  'correct' => false],
                        ['text' => '[[2,3],[0,12]]', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'A matrix with all elements below the main diagonal equal to zero is called:',
                    'difficulty'  => 'easy',
                    'tag'         => 'Matrix Types',
                    'explanation' => 'An upper triangular matrix has all zeros below the main diagonal.',
                    'options'     => [
                        ['text' => 'Upper triangular matrix', 'correct' => true],
                        ['text' => 'Lower triangular matrix', 'correct' => false],
                        ['text' => 'Diagonal matrix',         'correct' => false],
                        ['text' => 'Identity matrix',         'correct' => false],
                    ],
                ],
            ],
        ];
    }

    private function determinantsQuiz(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 1',
            'description' => 'Test your understanding of determinants and their properties',
            'questions'   => [
                [
                    'text'        => 'What is the determinant of A = [[3,2],[1,4]]?',
                    'difficulty'  => 'easy',
                    'tag'         => '2×2 Determinant',
                    'explanation' => 'For a 2×2 matrix [[a,b],[c,d]], det = ad - bc = (3)(4) - (2)(1) = 12 - 2 = 10.',
                    'options'     => [
                        ['text' => '10', 'correct' => true],
                        ['text' => '14', 'correct' => false],
                        ['text' => '2',  'correct' => false],
                        ['text' => '7',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'If det(A) = 0, the matrix A is:',
                    'difficulty'  => 'easy',
                    'tag'         => 'Determinant Properties',
                    'explanation' => 'A matrix with determinant 0 is singular — it does not have an inverse and its rows/columns are linearly dependent.',
                    'options'     => [
                        ['text' => 'Singular (non-invertible)',   'correct' => true],
                        ['text' => 'Non-singular (invertible)',   'correct' => false],
                        ['text' => 'Symmetric',                   'correct' => false],
                        ['text' => 'Orthogonal',                  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the effect on the determinant if two rows of a matrix are swapped?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Row Operations',
                    'explanation' => 'Swapping two rows changes the sign of the determinant.',
                    'options'     => [
                        ['text' => 'The determinant changes sign',     'correct' => true],
                        ['text' => 'The determinant doubles',          'correct' => false],
                        ['text' => 'The determinant becomes zero',     'correct' => false],
                        ['text' => 'The determinant remains the same', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is det(2A) if A is a 3×3 matrix and det(A) = 5?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Scalar Multiple',
                    'explanation' => 'For an n×n matrix, det(kA) = k^n × det(A). Here n=3, k=2: det(2A) = 2³ × 5 = 8 × 5 = 40.',
                    'options'     => [
                        ['text' => '40', 'correct' => true],
                        ['text' => '10', 'correct' => false],
                        ['text' => '20', 'correct' => false],
                        ['text' => '80', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Which property of determinants states det(AB) = det(A) × det(B)?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Determinant Properties',
                    'explanation' => 'The multiplicative property of determinants states that det(AB) = det(A) × det(B) for square matrices of the same size.',
                    'options'     => [
                        ['text' => 'Multiplicative property', 'correct' => true],
                        ['text' => 'Additive property',       'correct' => false],
                        ['text' => 'Transpose property',      'correct' => false],
                        ['text' => 'Scalar property',         'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the determinant of an identity matrix I_n?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Special Matrices',
                    'explanation' => 'The determinant of any identity matrix is always 1, regardless of its size.',
                    'options'     => [
                        ['text' => '1',          'correct' => true],
                        ['text' => '0',          'correct' => false],
                        ['text' => 'n',          'correct' => false],
                        ['text' => 'Undefined',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'If one row of a matrix is a scalar multiple of another row, the determinant is:',
                    'difficulty'  => 'medium',
                    'tag'         => 'Linear Dependence',
                    'explanation' => 'If two rows are linearly dependent (one is a multiple of another), the determinant is 0 because the rows are not independent.',
                    'options'     => [
                        ['text' => '0',                    'correct' => true],
                        ['text' => '1',                    'correct' => false],
                        ['text' => 'The scalar multiple',  'correct' => false],
                        ['text' => 'Negative of det(A)',   'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is det(A^T) compared to det(A)?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Transpose Property',
                    'explanation' => 'A fundamental property: the determinant of a matrix equals the determinant of its transpose: det(A^T) = det(A).',
                    'options'     => [
                        ['text' => 'det(A^T) = det(A)',   'correct' => true],
                        ['text' => 'det(A^T) = -det(A)',  'correct' => false],
                        ['text' => 'det(A^T) = 1/det(A)', 'correct' => false],
                        ['text' => 'det(A^T) = det(A)²',  'correct' => false],
                    ],
                ],
                [
                    'text'        => 'For a triangular matrix (upper or lower), the determinant equals:',
                    'difficulty'  => 'medium',
                    'tag'         => 'Triangular Matrices',
                    'explanation' => 'For any triangular matrix (upper or lower), the determinant is the product of its diagonal entries.',
                    'options'     => [
                        ['text' => 'The product of diagonal entries',  'correct' => true],
                        ['text' => 'The sum of diagonal entries',      'correct' => false],
                        ['text' => 'The largest diagonal entry',       'correct' => false],
                        ['text' => 'Always 1',                         'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Using cofactor expansion on the first row of A = [[1,2,3],[0,4,5],[1,0,6]], what is the cofactor C₁₁?',
                    'difficulty'  => 'hard',
                    'tag'         => 'Cofactor Expansion',
                    'explanation' => 'C₁₁ = (+1) × det([[4,5],[0,6]]) = det = (4×6)-(5×0) = 24.',
                    'options'     => [
                        ['text' => '24', 'correct' => true],
                        ['text' => '-24', 'correct' => false],
                        ['text' => '12',  'correct' => false],
                        ['text' => '20',  'correct' => false],
                    ],
                ],
            ],
        ];
    }

    private function systemsQuiz(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 1',
            'description' => 'Test your understanding of solving systems of linear equations',
            'questions'   => [
                [
                    'text'        => 'How many solutions does a consistent and independent system of linear equations have?',
                    'difficulty'  => 'easy',
                    'tag'         => 'System Classification',
                    'explanation' => 'A consistent and independent system has exactly one unique solution — the lines (or planes) intersect at a single point.',
                    'options'     => [
                        ['text' => 'Exactly one solution',      'correct' => true],
                        ['text' => 'No solution',               'correct' => false],
                        ['text' => 'Infinitely many solutions', 'correct' => false],
                        ['text' => 'Exactly two solutions',     'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What is the first step in Gaussian elimination?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Gaussian Elimination',
                    'explanation' => 'Gaussian elimination begins by writing the augmented matrix and then using row operations to create an upper triangular form (row echelon form).',
                    'options'     => [
                        ['text' => 'Write the augmented matrix and perform row operations',          'correct' => true],
                        ['text' => 'Find the determinant of the coefficient matrix',                 'correct' => false],
                        ['text' => 'Multiply both sides of each equation by the leading coefficient', 'correct' => false],
                        ['text' => 'Substitute values back into the equations',                      'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Solve: x + y = 5 and x - y = 1. What is x?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Solving Systems',
                    'explanation' => 'Adding the equations: 2x = 6, so x = 3. Then y = 5 - 3 = 2.',
                    'options'     => [
                        ['text' => '3', 'correct' => true],
                        ['text' => '2', 'correct' => false],
                        ['text' => '4', 'correct' => false],
                        ['text' => '1', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'A system of equations is inconsistent when:',
                    'difficulty'  => 'medium',
                    'tag'         => 'System Classification',
                    'explanation' => 'An inconsistent system has no solution — the equations represent parallel lines/planes that never intersect.',
                    'options'     => [
                        ['text' => 'It has no solution',                             'correct' => true],
                        ['text' => 'It has exactly one solution',                    'correct' => false],
                        ['text' => 'It has infinitely many solutions',               'correct' => false],
                        ['text' => 'The coefficient matrix has a non-zero determinant', 'correct' => false],
                    ],
                ],
                [
                    'text'        => 'In Cramer\'s Rule for AX = B, what is x₁?',
                    'difficulty'  => 'medium',
                    'tag'         => "Cramer's Rule",
                    'explanation' => "In Cramer's Rule, x₁ = det(A₁)/det(A), where A₁ is the matrix A with its first column replaced by B.",
                    'options'     => [
                        ['text' => 'det(A₁) / det(A), where A₁ replaces the first column of A with B', 'correct' => true],
                        ['text' => 'det(A) / det(A₁)',                                                 'correct' => false],
                        ['text' => 'det(B) / det(A)',                                                   'correct' => false],
                        ['text' => 'det(A) × det(B)',                                                   'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Which row operation is NOT allowed in Gaussian elimination?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Row Operations',
                    'explanation' => 'The three valid row operations are: swapping rows, multiplying a row by a non-zero scalar, and adding a multiple of one row to another. Dividing a row by zero is undefined.',
                    'options'     => [
                        ['text' => 'Dividing a row by zero',                         'correct' => true],
                        ['text' => 'Swapping two rows',                              'correct' => false],
                        ['text' => 'Multiplying a row by a non-zero constant',       'correct' => false],
                        ['text' => 'Adding a multiple of one row to another row',    'correct' => false],
                    ],
                ],
                [
                    'text'        => 'What does it mean for a system AX = B to have infinitely many solutions?',
                    'difficulty'  => 'medium',
                    'tag'         => 'Solution Types',
                    'explanation' => 'Infinitely many solutions occur when the system is consistent and dependent — the equations are not independent (some are multiples of others or the rank of A equals rank of augmented matrix but is less than n).',
                    'options'     => [
                        ['text' => 'The equations are dependent and det(A) = 0',       'correct' => true],
                        ['text' => 'The equations contradict each other',               'correct' => false],
                        ['text' => 'There are more unknowns than equations only',       'correct' => false],
                        ['text' => 'det(A) ≠ 0 and the system is consistent',          'correct' => false],
                    ],
                ],
                [
                    'text'        => 'The matrix equation AX = B has a unique solution when:',
                    'difficulty'  => 'medium',
                    'tag'         => 'Matrix Equations',
                    'explanation' => 'AX = B has a unique solution X = A⁻¹B if and only if A is invertible, which requires det(A) ≠ 0.',
                    'options'     => [
                        ['text' => 'A is invertible (det(A) ≠ 0)',        'correct' => true],
                        ['text' => 'A is a square matrix',                 'correct' => false],
                        ['text' => 'B is a zero vector',                   'correct' => false],
                        ['text' => 'A is a singular matrix',               'correct' => false],
                    ],
                ],
                [
                    'text'        => 'In row echelon form, what is true about the leading entry (pivot) of each row?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Row Echelon Form',
                    'explanation' => 'In row echelon form, each leading entry (pivot) must be strictly to the right of the leading entry in the row above it.',
                    'options'     => [
                        ['text' => 'It is strictly to the right of the pivot in the row above', 'correct' => true],
                        ['text' => 'It must equal 1',                                           'correct' => false],
                        ['text' => 'It must be to the left of the pivot in the row above',      'correct' => false],
                        ['text' => 'It can be anywhere in the row',                             'correct' => false],
                    ],
                ],
                [
                    'text'        => 'Using back-substitution after Gaussian elimination, which variable is solved first?',
                    'difficulty'  => 'easy',
                    'tag'         => 'Back-Substitution',
                    'explanation' => 'Back-substitution starts from the last equation (bottom of the upper triangular matrix) and works upward, solving for the last variable first.',
                    'options'     => [
                        ['text' => 'The last variable (from the bottom equation)',  'correct' => true],
                        ['text' => 'The first variable (from the top equation)',    'correct' => false],
                        ['text' => 'The variable with the largest coefficient',     'correct' => false],
                        ['text' => 'Any variable in any order',                     'correct' => false],
                    ],
                ],
            ],
        ];
    }

    private function matricesQuiz2(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 2',
            'description' => 'Matrix dimensions, types, and equality',
            'questions'   => [
                ['text'=>'What is the order of matrix A = [[1,2,3],[4,5,6]]?','difficulty'=>'easy','tag'=>'Matrix Dimensions','explanation'=>'A matrix with 2 rows and 3 columns has order 2×3.','options'=>[['text'=>'2×3','correct'=>true],['text'=>'3×2','correct'=>false],['text'=>'6×1','correct'=>false],['text'=>'2×2','correct'=>false]]],
                ['text'=>'A square matrix has:','difficulty'=>'easy','tag'=>'Matrix Types','explanation'=>'A square matrix has an equal number of rows and columns.','options'=>[['text'=>'Equal number of rows and columns','correct'=>true],['text'=>'More rows than columns','correct'=>false],['text'=>'More columns than rows','correct'=>false],['text'=>'All diagonal elements equal to 1','correct'=>false]]],
                ['text'=>'What is a row matrix?','difficulty'=>'easy','tag'=>'Matrix Types','explanation'=>'A row matrix (row vector) has exactly one row and any number of columns.','options'=>[['text'=>'A matrix with only one row','correct'=>true],['text'=>'A matrix with only one column','correct'=>false],['text'=>'A matrix with all rows equal','correct'=>false],['text'=>'A square matrix','correct'=>false]]],
                ['text'=>'If A = [[0,0],[0,0]], A is called a:','difficulty'=>'easy','tag'=>'Matrix Types','explanation'=>'A matrix where all entries are zero is called the zero matrix (or null matrix).','options'=>[['text'=>'Zero matrix','correct'=>true],['text'=>'Identity matrix','correct'=>false],['text'=>'Singular matrix','correct'=>false],['text'=>'Unit matrix','correct'=>false]]],
                ['text'=>'A = [[2,0,0],[0,5,0],[0,0,3]]. What type of matrix is this?','difficulty'=>'easy','tag'=>'Matrix Types','explanation'=>'A diagonal matrix is a square matrix where all off-diagonal entries are zero.','options'=>[['text'=>'Diagonal matrix','correct'=>true],['text'=>'Identity matrix','correct'=>false],['text'=>'Scalar matrix','correct'=>false],['text'=>'Zero matrix','correct'=>false]]],
                ['text'=>'Matrices A and B are equal if:','difficulty'=>'easy','tag'=>'Matrix Equality','explanation'=>'Two matrices are equal if and only if they have the same dimensions and every corresponding element is equal.','options'=>[['text'=>'They have the same dimensions and all corresponding elements are equal','correct'=>true],['text'=>'They have the same sum of elements','correct'=>false],['text'=>'They have the same number of rows','correct'=>false],['text'=>'Their determinants are equal','correct'=>false]]],
                ['text'=>'How many elements does a 3×4 matrix have?','difficulty'=>'easy','tag'=>'Matrix Dimensions','explanation'=>'A 3×4 matrix has 3 rows and 4 columns, giving 3×4 = 12 elements.','options'=>[['text'=>'12','correct'=>true],['text'=>'7','correct'=>false],['text'=>'9','correct'=>false],['text'=>'16','correct'=>false]]],
                ['text'=>'A column matrix has:','difficulty'=>'easy','tag'=>'Matrix Types','explanation'=>'A column matrix (column vector) has exactly one column and any number of rows.','options'=>[['text'=>'Only one column','correct'=>true],['text'=>'Only one row','correct'=>false],['text'=>'Equal number of rows and columns','correct'=>false],['text'=>'All columns identical','correct'=>false]]],
                ['text'=>'A scalar matrix is:','difficulty'=>'medium','tag'=>'Matrix Types','explanation'=>'A scalar matrix is a diagonal matrix where all diagonal entries are the same value.','options'=>[['text'=>'A diagonal matrix where all diagonal entries are equal','correct'=>true],['text'=>'A matrix multiplied by a scalar','correct'=>false],['text'=>'A 1×1 matrix','correct'=>false],['text'=>'A matrix with all entries being scalars','correct'=>false]]],
                ['text'=>'If A is a 3×2 matrix and B is a 3×2 matrix, what is the order of A + B?','difficulty'=>'easy','tag'=>'Matrix Operations','explanation'=>'Matrix addition preserves dimensions; A + B has the same order as A and B, which is 3×2.','options'=>[['text'=>'3×2','correct'=>true],['text'=>'6×4','correct'=>false],['text'=>'3×4','correct'=>false],['text'=>'Cannot be added','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz3(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 3',
            'description' => 'Scalar multiplication and subtraction',
            'questions'   => [
                ['text'=>'If A = [[4,3],[2,1]] and B = [[1,2],[3,4]], what is A − B?','difficulty'=>'easy','tag'=>'Matrix Subtraction','explanation'=>'Matrix subtraction is element-wise: A−B = [[4−1,3−2],[2−3,1−4]] = [[3,1],[−1,−3]].','options'=>[['text'=>'[[3,1],[−1,−3]]','correct'=>true],['text'=>'[[3,5],[5,5]]','correct'=>false],['text'=>'[[5,5],[5,5]]','correct'=>false],['text'=>'[[−3,−1],[1,3]]','correct'=>false]]],
                ['text'=>'Is matrix subtraction commutative? (A − B = B − A?)','difficulty'=>'easy','tag'=>'Matrix Properties','explanation'=>'Matrix subtraction is NOT commutative. A−B = −(B−A), so they are negatives of each other.','options'=>[['text'=>'No, A − B ≠ B − A in general','correct'=>true],['text'=>'Yes, always','correct'=>false],['text'=>'Only for square matrices','correct'=>false],['text'=>'Only when det(A) = det(B)','correct'=>false]]],
                ['text'=>'If A = [[1,2],[3,4]] and k = −2, what is kA?','difficulty'=>'easy','tag'=>'Scalar Multiplication','explanation'=>'Scalar multiplication multiplies every element by k: −2×[[1,2],[3,4]] = [[−2,−4],[−6,−8]].','options'=>[['text'=>'[[−2,−4],[−6,−8]]','correct'=>true],['text'=>'[[2,4],[6,8]]','correct'=>false],['text'=>'[[−1,−2],[−3,−4]]','correct'=>false],['text'=>'[[2,−4],[−6,4]]','correct'=>false]]],
                ['text'=>'What is (A + B)^T equal to?','difficulty'=>'medium','tag'=>'Transpose','explanation'=>'The transpose of a sum equals the sum of transposes: (A+B)^T = A^T + B^T.','options'=>[['text'=>'A^T + B^T','correct'=>true],['text'=>'A^T × B^T','correct'=>false],['text'=>'B^T + A','correct'=>false],['text'=>'(A^T)^T + B','correct'=>false]]],
                ['text'=>'If A = [[3,1],[2,5]] and B = [[0,4],[1,2]], what is 2A − B?','difficulty'=>'medium','tag'=>'Mixed Operations','explanation'=>'2A = [[6,2],[4,10]]; 2A−B = [[6−0,2−4],[4−1,10−2]] = [[6,−2],[3,8]].','options'=>[['text'=>'[[6,−2],[3,8]]','correct'=>true],['text'=>'[[6,6],[5,12]]','correct'=>false],['text'=>'[[5,−3],[3,8]]','correct'=>false],['text'=>'[[6,2],[3,8]]','correct'=>false]]],
                ['text'=>'For scalar c and matrix A, (cA)^T = ?','difficulty'=>'medium','tag'=>'Transpose','explanation'=>'Scalar factors pass through the transpose: (cA)^T = c(A^T).','options'=>[['text'=>'c(A^T)','correct'=>true],['text'=>'cA','correct'=>false],['text'=>'(c^T)A^T','correct'=>false],['text'=>'A^T / c','correct'=>false]]],
                ['text'=>'A = [[1,2,3]] and B = [[4,5,6]]. What is A + B?','difficulty'=>'easy','tag'=>'Matrix Addition','explanation'=>'Row matrices of the same size add element-wise: [[1+4,2+5,3+6]] = [[5,7,9]].','options'=>[['text'=>'[[5,7,9]]','correct'=>true],['text'=>'[[4,10,18]]','correct'=>false],['text'=>'[[5,7,8]]','correct'=>false],['text'=>'Undefined','correct'=>false]]],
                ['text'=>'If A = [[6,4],[2,8]] and B = (1/2)A, what is B?','difficulty'=>'easy','tag'=>'Scalar Multiplication','explanation'=>'(1/2)×[[6,4],[2,8]] = [[3,2],[1,4]].','options'=>[['text'=>'[[3,2],[1,4]]','correct'=>true],['text'=>'[[12,8],[4,16]]','correct'=>false],['text'=>'[[6,2],[1,8]]','correct'=>false],['text'=>'[[3,4],[2,4]]','correct'=>false]]],
                ['text'=>'For any matrix A, what is A + (−A)?','difficulty'=>'easy','tag'=>'Matrix Properties','explanation'=>'A + (−A) = 0 for matrices, just like scalars. The result is the zero matrix.','options'=>[['text'=>'Zero matrix','correct'=>true],['text'=>'Identity matrix','correct'=>false],['text'=>'2A','correct'=>false],['text'=>'A^T','correct'=>false]]],
                ['text'=>'If A = [[a,b],[c,d]] and B = [[e,f],[g,h]], what is A − B?','difficulty'=>'easy','tag'=>'Matrix Subtraction','explanation'=>'Matrix subtraction is element-wise: A−B = [[a−e,b−f],[c−g,d−h]].','options'=>[['text'=>'[[a−e,b−f],[c−g,d−h]]','correct'=>true],['text'=>'[[ae,bf],[cg,dh]]','correct'=>false],['text'=>'[[a+e,b+f],[c+g,d+h]]','correct'=>false],['text'=>'[[a/e,b/f],[c/g,d/h]]','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz4(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 4',
            'description' => 'Matrix multiplication practice',
            'questions'   => [
                ['text'=>'A = [[1,2],[3,4]], B = [[5,6],[7,8]]. What is the (1,1) entry of AB?','difficulty'=>'medium','tag'=>'Matrix Multiplication','explanation'=>'(1,1) entry = row 1 of A × col 1 of B = 1×5 + 2×7 = 5 + 14 = 19.','options'=>[['text'=>'19','correct'=>true],['text'=>'17','correct'=>false],['text'=>'23','correct'=>false],['text'=>'11','correct'=>false]]],
                ['text'=>'If A is 2×3 and B is 3×2, what is the size of AB?','difficulty'=>'easy','tag'=>'Matrix Multiplication','explanation'=>'The product of an m×n matrix and an n×p matrix is m×p. Here 2×3 times 3×2 = 2×2.','options'=>[['text'=>'2×2','correct'=>true],['text'=>'3×3','correct'=>false],['text'=>'2×3','correct'=>false],['text'=>'3×2','correct'=>false]]],
                ['text'=>'When is the matrix product AB NOT defined?','difficulty'=>'easy','tag'=>'Matrix Multiplication','explanation'=>'AB is defined only when the number of columns of A equals the number of rows of B.','options'=>[['text'=>'When columns of A ≠ rows of B','correct'=>true],['text'=>'When A and B are both square','correct'=>false],['text'=>'When det(A) = 0','correct'=>false],['text'=>'When A = B','correct'=>false]]],
                ['text'=>'Let I be the 2×2 identity and B = [[3,4],[5,6]]. What is IB?','difficulty'=>'easy','tag'=>'Identity Matrix','explanation'=>'The identity matrix acts as the multiplicative identity: IB = B for any compatible matrix B.','options'=>[['text'=>'[[3,4],[5,6]]','correct'=>true],['text'=>'[[4,3],[6,5]]','correct'=>false],['text'=>'[[1,0],[0,1]]','correct'=>false],['text'=>'[[3,0],[0,6]]','correct'=>false]]],
                ['text'=>'Is (AB)C = A(BC)?','difficulty'=>'easy','tag'=>'Matrix Multiplication','explanation'=>'Matrix multiplication is associative: (AB)C = A(BC) for any compatible matrices.','options'=>[['text'=>'Yes, matrix multiplication is associative','correct'=>true],['text'=>'No, never associative','correct'=>false],['text'=>'Only when all matrices are square','correct'=>false],['text'=>'Only when det(A) ≠ 0','correct'=>false]]],
                ['text'=>'Is A(B + C) = AB + AC for matrices?','difficulty'=>'easy','tag'=>'Distributive Law','explanation'=>'Matrix multiplication distributes over addition: A(B+C) = AB + AC.','options'=>[['text'=>'Yes, multiplication distributes over addition','correct'=>true],['text'=>'No, this property does not hold','correct'=>false],['text'=>'Only for diagonal matrices','correct'=>false],['text'=>'Only when B = C','correct'=>false]]],
                ['text'=>'A = [[2,1],[4,3]] and I is 2×2 identity. What is AI?','difficulty'=>'easy','tag'=>'Identity Matrix','explanation'=>'AI = A for any square matrix A; the identity is the right multiplicative identity.','options'=>[['text'=>'[[2,1],[4,3]]','correct'=>true],['text'=>'[[1,0],[0,1]]','correct'=>false],['text'=>'[[4,2],[8,6]]','correct'=>false],['text'=>'[[2,4],[1,3]]','correct'=>false]]],
                ['text'=>'A = [[1,2],[3,4]], B = [[1,0],[2,1]]. What is the (2,1) entry of AB?','difficulty'=>'medium','tag'=>'Matrix Multiplication','explanation'=>'(2,1) entry = row 2 of A × col 1 of B = 3×1 + 4×2 = 3 + 8 = 11.','options'=>[['text'=>'11','correct'=>true],['text'=>'7','correct'=>false],['text'=>'3','correct'=>false],['text'=>'8','correct'=>false]]],
                ['text'=>'If A = [[1,1],[0,1]], what is A² = AA?','difficulty'=>'medium','tag'=>'Matrix Power','explanation'=>'A² = [[1×1+1×0, 1×1+1×1],[0×1+1×0, 0×1+1×1]] = [[1,2],[0,1]].','options'=>[['text'=>'[[1,2],[0,1]]','correct'=>true],['text'=>'[[1,1],[0,1]]','correct'=>false],['text'=>'[[2,1],[0,2]]','correct'=>false],['text'=>'[[1,0],[0,1]]','correct'=>false]]],
                ['text'=>'For square matrices A and B, when does AB = BA always hold?','difficulty'=>'medium','tag'=>'Commutativity','explanation'=>'Matrix multiplication is generally not commutative. AB = BA only in special cases such as when B = I or B is a scalar multiple of I.','options'=>[['text'=>'Only in special cases (e.g., B = I or B = kI)','correct'=>true],['text'=>'Always','correct'=>false],['text'=>'Never','correct'=>false],['text'=>'When both are symmetric','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz5(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 5',
            'description' => 'Transpose and symmetry',
            'questions'   => [
                ['text'=>'If A = [[1,4],[2,5],[3,6]], what is A^T?','difficulty'=>'easy','tag'=>'Transpose','explanation'=>'Transposing flips rows and columns: the 3×2 matrix becomes a 2×3 matrix [[1,2,3],[4,5,6]].','options'=>[['text'=>'[[1,2,3],[4,5,6]]','correct'=>true],['text'=>'[[1,4],[2,5],[3,6]]','correct'=>false],['text'=>'[[6,5,4],[3,2,1]]','correct'=>false],['text'=>'[[1,2],[3,4],[5,6]]','correct'=>false]]],
                ['text'=>'For any matrix A, what is (A^T)^T?','difficulty'=>'easy','tag'=>'Transpose','explanation'=>'Transposing twice returns the original matrix: (A^T)^T = A.','options'=>[['text'=>'A','correct'=>true],['text'=>'A²','correct'=>false],['text'=>'−A','correct'=>false],['text'=>'I','correct'=>false]]],
                ['text'=>'If A is symmetric, which is true?','difficulty'=>'easy','tag'=>'Symmetric Matrix','explanation'=>'A symmetric matrix satisfies A = A^T, meaning a_{ij} = a_{ji} for all i, j.','options'=>[['text'=>'A = A^T','correct'=>true],['text'=>'A = −A^T','correct'=>false],['text'=>'A = A^{−1}','correct'=>false],['text'=>'A^T = 0','correct'=>false]]],
                ['text'=>'A = [[3,1],[1,4]]. Is A symmetric?','difficulty'=>'easy','tag'=>'Symmetric Matrix','explanation'=>'Since A[1][2] = 1 = A[2][1], we have A = A^T, so A is symmetric.','options'=>[['text'=>'Yes, because A = A^T','correct'=>true],['text'=>'No, diagonal entries are different','correct'=>false],['text'=>'No, must have equal diagonal entries','correct'=>false],['text'=>'Only if det(A) = 0','correct'=>false]]],
                ['text'=>'What is (AB)^T equal to?','difficulty'=>'medium','tag'=>'Transpose','explanation'=>'The transpose of a product reverses the order: (AB)^T = B^T A^T.','options'=>[['text'=>'B^T A^T','correct'=>true],['text'=>'A^T B^T','correct'=>false],['text'=>'(BA)^T','correct'=>false],['text'=>'AB itself','correct'=>false]]],
                ['text'=>'If A is an n×m matrix, what is the size of A^T?','difficulty'=>'easy','tag'=>'Transpose','explanation'=>'Transposing an n×m matrix gives an m×n matrix.','options'=>[['text'=>'m×n','correct'=>true],['text'=>'n×m','correct'=>false],['text'=>'n×n','correct'=>false],['text'=>'m×m','correct'=>false]]],
                ['text'=>'A skew-symmetric matrix satisfies:','difficulty'=>'medium','tag'=>'Skew-Symmetric','explanation'=>'A skew-symmetric (anti-symmetric) matrix satisfies A^T = −A, meaning a_{ij} = −a_{ji}.','options'=>[['text'=>'A^T = −A','correct'=>true],['text'=>'A^T = A','correct'=>false],['text'=>'A^T = A^{−1}','correct'=>false],['text'=>'A² = −A','correct'=>false]]],
                ['text'=>'Which matrix is skew-symmetric?','difficulty'=>'medium','tag'=>'Skew-Symmetric','explanation'=>'[[0,1],[−1,0]] satisfies A^T = −A since the (1,2) entry is 1 and the (2,1) entry is −1.','options'=>[['text'=>'[[0,1],[−1,0]]','correct'=>true],['text'=>'[[1,0],[0,1]]','correct'=>false],['text'=>'[[1,2],[2,1]]','correct'=>false],['text'=>'[[2,0],[0,2]]','correct'=>false]]],
                ['text'=>'For symmetric matrices A and B of the same size, is A + B also symmetric?','difficulty'=>'medium','tag'=>'Symmetric Matrix','explanation'=>'(A+B)^T = A^T + B^T = A + B (since both are symmetric), so A+B is symmetric.','options'=>[['text'=>'Yes, A + B is symmetric','correct'=>true],['text'=>'No, not necessarily','correct'=>false],['text'=>'Only if AB = BA','correct'=>false],['text'=>'Only if they have the same size','correct'=>false]]],
                ['text'=>'If A = [[2,3],[3,5]], what is A + A^T?','difficulty'=>'medium','tag'=>'Symmetric Matrix','explanation'=>'Since A is symmetric (A = A^T), A + A^T = 2A = [[4,6],[6,10]].','options'=>[['text'=>'[[4,6],[6,10]]','correct'=>true],['text'=>'[[2,3],[3,5]]','correct'=>false],['text'=>'[[4,6],[6,5]]','correct'=>false],['text'=>'[[4,0],[0,10]]','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz6(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 6',
            'description' => 'Special matrices: trace, orthogonal, idempotent',
            'questions'   => [
                ['text'=>'The trace of matrix A = [[2,3,4],[1,5,6],[7,8,9]] is:','difficulty'=>'easy','tag'=>'Trace','explanation'=>'The trace is the sum of diagonal elements: 2 + 5 + 9 = 16.','options'=>[['text'=>'16','correct'=>true],['text'=>'45','correct'=>false],['text'=>'9','correct'=>false],['text'=>'2','correct'=>false]]],
                ['text'=>'For a 2×2 matrix A = [[a,b],[c,d]], the trace is:','difficulty'=>'easy','tag'=>'Trace','explanation'=>'The trace is the sum of the main diagonal entries: tr(A) = a + d.','options'=>[['text'=>'a + d','correct'=>true],['text'=>'ad − bc','correct'=>false],['text'=>'a + b + c + d','correct'=>false],['text'=>'a × d','correct'=>false]]],
                ['text'=>'An orthogonal matrix satisfies:','difficulty'=>'medium','tag'=>'Orthogonal Matrix','explanation'=>'A real orthogonal matrix satisfies A^T A = I, which means A^T = A^{−1}.','options'=>[['text'=>'A^T = A^{−1}','correct'=>true],['text'=>'A^T = A','correct'=>false],['text'=>'A² = I','correct'=>false],['text'=>'det(A) = 0','correct'=>false]]],
                ['text'=>'What is the rank of the zero matrix?','difficulty'=>'easy','tag'=>'Matrix Rank','explanation'=>'The zero matrix has no non-zero rows, so its rank is 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'1','correct'=>false],['text'=>'n','correct'=>false],['text'=>'Undefined','correct'=>false]]],
                ['text'=>'An involutory matrix satisfies:','difficulty'=>'medium','tag'=>'Special Matrices','explanation'=>'An involutory matrix is its own inverse: A² = I.','options'=>[['text'=>'A² = I','correct'=>true],['text'=>'A² = A','correct'=>false],['text'=>'A^T = A','correct'=>false],['text'=>'A^{−1} = 0','correct'=>false]]],
                ['text'=>'A nilpotent matrix A satisfies:','difficulty'=>'medium','tag'=>'Special Matrices','explanation'=>'A nilpotent matrix satisfies A^k = 0 for some positive integer k. The matrix itself may be non-zero.','options'=>[['text'=>'A^k = 0 for some positive integer k','correct'=>true],['text'=>'A² = A','correct'=>false],['text'=>'A = A^T','correct'=>false],['text'=>'det(A) = 1','correct'=>false]]],
                ['text'=>'If A is both symmetric and skew-symmetric, A must be:','difficulty'=>'hard','tag'=>'Special Matrices','explanation'=>'A = A^T and A = −A^T implies A = −A, so 2A = 0, meaning A is the zero matrix.','options'=>[['text'=>'The zero matrix','correct'=>true],['text'=>'An identity matrix','correct'=>false],['text'=>'A diagonal matrix','correct'=>false],['text'=>'An idempotent matrix','correct'=>false]]],
                ['text'=>'The trace is preserved under similarity: if B = P^{−1}AP then:','difficulty'=>'hard','tag'=>'Trace','explanation'=>'Similar matrices have the same trace because tr(P^{−1}AP) = tr(APP^{−1}) = tr(AI) = tr(A).','options'=>[['text'=>'tr(B) = tr(A)','correct'=>true],['text'=>'tr(B) = tr(P) × tr(A)','correct'=>false],['text'=>'tr(B) = 0','correct'=>false],['text'=>'tr(B) = det(A)','correct'=>false]]],
                ['text'=>'An idempotent matrix satisfies:','difficulty'=>'medium','tag'=>'Special Matrices','explanation'=>'An idempotent matrix satisfies A² = A. Projection matrices are a common example.','options'=>[['text'=>'A² = A','correct'=>true],['text'=>'A² = I','correct'=>false],['text'=>'A^T = A','correct'=>false],['text'=>'A^k = 0','correct'=>false]]],
                ['text'=>'For upper and lower triangular matrices, the determinant equals:','difficulty'=>'easy','tag'=>'Triangular Matrices','explanation'=>'For any triangular matrix, the determinant is the product of the diagonal entries.','options'=>[['text'=>'Product of diagonal entries','correct'=>true],['text'=>'Sum of diagonal entries','correct'=>false],['text'=>'The largest diagonal entry','correct'=>false],['text'=>'Always 1','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz7(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 7',
            'description' => 'Matrix inverse',
            'questions'   => [
                ['text'=>'The inverse of A = [[2,1],[5,3]] is:','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'det(A) = 6−5 = 1. A^{−1} = (1/det)×[[d,−b],[−c,a]] = [[3,−1],[−5,2]].','options'=>[['text'=>'[[3,−1],[−5,2]]','correct'=>true],['text'=>'[[3,1],[5,2]]','correct'=>false],['text'=>'[[1/2,1],[1/5,1/3]]','correct'=>false],['text'=>'[[−3,1],[5,−2]]','correct'=>false]]],
                ['text'=>'For matrix A to have an inverse, which condition must hold?','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'A square matrix has an inverse if and only if its determinant is non-zero.','options'=>[['text'=>'det(A) ≠ 0','correct'=>true],['text'=>'A must be symmetric','correct'=>false],['text'=>'A must be upper triangular','correct'=>false],['text'=>'All entries of A must be non-zero','correct'=>false]]],
                ['text'=>'If A and B are invertible n×n matrices, what is (AB)^{−1}?','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'The inverse of a product reverses the order: (AB)^{−1} = B^{−1}A^{−1}.','options'=>[['text'=>'B^{−1}A^{−1}','correct'=>true],['text'=>'A^{−1}B^{−1}','correct'=>false],['text'=>'AB','correct'=>false],['text'=>'(A^{−1})(B^{−1})^T','correct'=>false]]],
                ['text'=>'For any invertible matrix A, what is A × A^{−1}?','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'By definition of the inverse, AA^{−1} = I (the identity matrix).','options'=>[['text'=>'Identity matrix I','correct'=>true],['text'=>'Zero matrix','correct'=>false],['text'=>'A²','correct'=>false],['text'=>'A^T','correct'=>false]]],
                ['text'=>'What is (A^{−1})^{−1}?','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'The inverse of the inverse is the original matrix: (A^{−1})^{−1} = A.','options'=>[['text'=>'A','correct'=>true],['text'=>'A^T','correct'=>false],['text'=>'I','correct'=>false],['text'=>'−A','correct'=>false]]],
                ['text'=>'What is (A^T)^{−1}?','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'(A^T)^{−1} = (A^{−1})^T — the inverse of the transpose equals the transpose of the inverse.','options'=>[['text'=>'(A^{−1})^T','correct'=>true],['text'=>'A^T','correct'=>false],['text'=>'A','correct'=>false],['text'=>'I','correct'=>false]]],
                ['text'=>'If A = [[1,0],[0,2]], what is A^{−1}?','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'For a diagonal matrix, the inverse has reciprocals on the diagonal: [[1,0],[0,1/2]].','options'=>[['text'=>'[[1,0],[0,1/2]]','correct'=>true],['text'=>'[[0,1],[2,0]]','correct'=>false],['text'=>'[[1,0],[0,−2]]','correct'=>false],['text'=>'[[2,0],[0,1]]','correct'=>false]]],
                ['text'=>'If det(A) = 4, what is det(A^{−1})?','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'det(A)×det(A^{−1}) = det(I) = 1, so det(A^{−1}) = 1/det(A) = 1/4.','options'=>[['text'=>'1/4','correct'=>true],['text'=>'−4','correct'=>false],['text'=>'4','correct'=>false],['text'=>'16','correct'=>false]]],
                ['text'=>'A matrix is singular if:','difficulty'=>'easy','tag'=>'Singular Matrix','explanation'=>'A singular matrix has determinant zero and therefore has no inverse.','options'=>[['text'=>'Its determinant is zero','correct'=>true],['text'=>'Its determinant is one','correct'=>false],['text'=>'It is not square','correct'=>false],['text'=>'It has all positive entries','correct'=>false]]],
                ['text'=>'For 2×2 matrix [[a,b],[c,d]] with det ≠ 0, the inverse formula is:','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'A^{−1} = (1/(ad−bc)) × [[d,−b],[−c,a]].','options'=>[['text'=>'(1/(ad−bc)) × [[d,−b],[−c,a]]','correct'=>true],['text'=>'(1/(ad+bc)) × [[d,b],[c,a]]','correct'=>false],['text'=>'(1/(ad−bc)) × [[a,b],[c,d]]','correct'=>false],['text'=>'(1/(ad−bc)) × [[−d,b],[c,−a]]','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz8(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 8',
            'description' => 'Row operations and echelon form',
            'questions'   => [
                ['text'=>'Which of the following is a valid elementary row operation?','difficulty'=>'easy','tag'=>'Row Operations','explanation'=>'The three valid elementary row operations are: swap two rows, multiply a row by a non-zero scalar, and add a multiple of one row to another.','options'=>[['text'=>'Multiplying a row by a non-zero constant','correct'=>true],['text'=>'Adding a constant to all elements of a row','correct'=>false],['text'=>'Multiplying the entire matrix by a scalar','correct'=>false],['text'=>'Replacing a row with its absolute values','correct'=>false]]],
                ['text'=>'In row echelon form (REF), pivots (leading entries) must:','difficulty'=>'easy','tag'=>'Row Echelon Form','explanation'=>'In REF, each pivot must be strictly to the right of the pivot in the row above it.','options'=>[['text'=>'Move strictly right as you go down rows','correct'=>true],['text'=>'All equal 1','correct'=>false],['text'=>'Have zeros both above and below them','correct'=>false],['text'=>'Be in the first column','correct'=>false]]],
                ['text'=>'In reduced row echelon form (RREF), each leading 1 must:','difficulty'=>'medium','tag'=>'RREF','explanation'=>'In RREF, each pivot is 1 and is the only non-zero entry in its column.','options'=>[['text'=>'Be 1 with zeros both above and below it','correct'=>true],['text'=>'Be 1 with zeros only below it','correct'=>false],['text'=>'Be non-zero','correct'=>false],['text'=>'Equal the row number','correct'=>false]]],
                ['text'=>'Which matrix is in row echelon form?','difficulty'=>'medium','tag'=>'Row Echelon Form','explanation'=>'REF requires each pivot to be strictly to the right of the one above. [[1,2,3],[0,1,4],[0,0,5]] satisfies this.','options'=>[['text'=>'[[1,2,3],[0,1,4],[0,0,5]]','correct'=>true],['text'=>'[[1,2,3],[1,0,4],[0,0,5]]','correct'=>false],['text'=>'[[0,1,3],[1,2,4],[0,0,5]]','correct'=>false],['text'=>'[[1,2,3],[0,0,4],[0,1,5]]','correct'=>false]]],
                ['text'=>'What is the rank of A = [[1,2,3],[0,0,0],[0,0,0]]?','difficulty'=>'easy','tag'=>'Matrix Rank','explanation'=>'Rank equals the number of non-zero rows in row echelon form. Only one non-zero row, so rank = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'0','correct'=>false],['text'=>'3','correct'=>false],['text'=>'2','correct'=>false]]],
                ['text'=>'Applying R2 ← R2 − 2R1 to [[1,3,5],[2,4,6]] gives:','difficulty'=>'medium','tag'=>'Row Operations','explanation'=>'R2 ← [2,4,6] − 2×[1,3,5] = [2−2, 4−6, 6−10] = [0,−2,−4]. Result: [[1,3,5],[0,−2,−4]].','options'=>[['text'=>'[[1,3,5],[0,−2,−4]]','correct'=>true],['text'=>'[[1,3,5],[1,1,1]]','correct'=>false],['text'=>'[[1,3,5],[0,4,6]]','correct'=>false],['text'=>'[[2,6,10],[2,4,6]]','correct'=>false]]],
                ['text'=>'Row operations do NOT change which property of a linear system?','difficulty'=>'medium','tag'=>'Row Operations','explanation'=>'Elementary row operations preserve the solution set of the corresponding linear system.','options'=>[['text'=>'The solution set','correct'=>true],['text'=>'The entries of the matrix','correct'=>false],['text'=>'The echelon form','correct'=>false],['text'=>'The pivot positions','correct'=>false]]],
                ['text'=>'The rank of a matrix equals:','difficulty'=>'easy','tag'=>'Matrix Rank','explanation'=>'Rank is defined as the number of non-zero rows in the row echelon form (= number of pivot positions).','options'=>[['text'=>'The number of non-zero rows in REF','correct'=>true],['text'=>'The number of rows','correct'=>false],['text'=>'The number of columns','correct'=>false],['text'=>'The number of zero rows','correct'=>false]]],
                ['text'=>'The RREF of the identity matrix I_n is:','difficulty'=>'easy','tag'=>'RREF','explanation'=>'The identity matrix already satisfies all RREF conditions, so its RREF is itself.','options'=>[['text'=>'I_n itself','correct'=>true],['text'=>'A zero matrix','correct'=>false],['text'=>'An upper triangular matrix','correct'=>false],['text'=>'A permutation of I_n','correct'=>false]]],
                ['text'=>'After Gaussian elimination on a 3×3 system: [[1,2,3,10],[0,1,4,7],[0,0,2,6]]. What is z?','difficulty'=>'medium','tag'=>'Back-Substitution','explanation'=>'From row 3: 2z = 6, so z = 3.','options'=>[['text'=>'3','correct'=>true],['text'=>'6','correct'=>false],['text'=>'2','correct'=>false],['text'=>'1','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz9(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 9',
            'description' => 'Mixed matrix operations',
            'questions'   => [
                ['text'=>'If A = [[1,2],[3,4]], what is A² = AA?','difficulty'=>'medium','tag'=>'Matrix Power','explanation'=>'A² = [[1+6, 2+8],[3+12, 6+16]] = [[7,10],[15,22]].','options'=>[['text'=>'[[7,10],[15,22]]','correct'=>true],['text'=>'[[1,4],[9,16]]','correct'=>false],['text'=>'[[2,4],[6,8]]','correct'=>false],['text'=>'[[1,2],[3,4]]','correct'=>false]]],
                ['text'=>'For invertible A, which expression equals the identity I?','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'By definition, AA^{−1} = I.','options'=>[['text'=>'A × A^{−1}','correct'=>true],['text'=>'A + A^{−1}','correct'=>false],['text'=>'A − A^{−1}','correct'=>false],['text'=>'A^T × A','correct'=>false]]],
                ['text'=>'A = [[0,1],[1,0]] (permutation matrix). What is A²?','difficulty'=>'easy','tag'=>'Matrix Power','explanation'=>'A² = [[0×0+1×1, 0×1+1×0],[1×0+0×1, 1×1+0×0]] = [[1,0],[0,1]] = I.','options'=>[['text'=>'[[1,0],[0,1]]','correct'=>true],['text'=>'[[0,1],[1,0]]','correct'=>false],['text'=>'[[0,0],[0,0]]','correct'=>false],['text'=>'[[1,1],[1,1]]','correct'=>false]]],
                ['text'=>'A = [[2,0],[0,3]]. What is A²?','difficulty'=>'easy','tag'=>'Diagonal Matrix','explanation'=>'For a diagonal matrix, A² has the squares of the diagonal entries: [[4,0],[0,9]].','options'=>[['text'=>'[[4,0],[0,9]]','correct'=>true],['text'=>'[[4,0],[0,6]]','correct'=>false],['text'=>'[[2,0],[0,3]]','correct'=>false],['text'=>'[[6,0],[0,9]]','correct'=>false]]],
                ['text'=>'(A + B)² = A² + 2AB + B² is true for matrices when:','difficulty'=>'medium','tag'=>'Matrix Power','explanation'=>'The binomial formula holds only when AB = BA (matrices commute). In general AB ≠ BA.','options'=>[['text'=>'AB = BA (A and B commute)','correct'=>true],['text'=>'Always, same as scalars','correct'=>false],['text'=>'Never for matrices','correct'=>false],['text'=>'Only when A = B','correct'=>false]]],
                ['text'=>'The expression A^T A is always:','difficulty'=>'medium','tag'=>'Symmetric Matrix','explanation'=>'(A^T A)^T = A^T (A^T)^T = A^T A, so A^T A is always symmetric.','options'=>[['text'=>'Symmetric','correct'=>true],['text'=>'Skew-symmetric','correct'=>false],['text'=>'Invertible','correct'=>false],['text'=>'Equal to AA^T','correct'=>false]]],
                ['text'=>'A = [[1,0],[0,−1]]. What is A³?','difficulty'=>'medium','tag'=>'Matrix Power','explanation'=>'A² = [[1,0],[0,1]] = I, so A³ = A²×A = I×A = A = [[1,0],[0,−1]].','options'=>[['text'=>'[[1,0],[0,−1]]','correct'=>true],['text'=>'[[1,0],[0,1]]','correct'=>false],['text'=>'[[−1,0],[0,−1]]','correct'=>false],['text'=>'[[1,0],[0,−3]]','correct'=>false]]],
                ['text'=>'Which is always true for matrices A and B of compatible sizes?','difficulty'=>'medium','tag'=>'Transpose','explanation'=>'(A+B)^T = A^T + B^T is always valid. The other options are generally false.','options'=>[['text'=>'(A + B)^T = A^T + B^T','correct'=>true],['text'=>'(AB)^T = A^T B^T','correct'=>false],['text'=>'AB = BA','correct'=>false],['text'=>'(AB)^{−1} = A^{−1}B^{−1}','correct'=>false]]],
                ['text'=>'If A is 3×3 with det(A) = 6, what is det(3A)?','difficulty'=>'medium','tag'=>'Determinant','explanation'=>'det(kA) = k^n × det(A) for an n×n matrix. det(3A) = 3³ × 6 = 27 × 6 = 162.','options'=>[['text'=>'162','correct'=>true],['text'=>'18','correct'=>false],['text'=>'54','correct'=>false],['text'=>'6','correct'=>false]]],
                ['text'=>'Which expression always produces a symmetric matrix?','difficulty'=>'medium','tag'=>'Symmetric Matrix','explanation'=>'(A + A^T)^T = A^T + (A^T)^T = A^T + A = A + A^T, so A + A^T is always symmetric.','options'=>[['text'=>'A + A^T','correct'=>true],['text'=>'A − A^T','correct'=>false],['text'=>'AB (arbitrary B)','correct'=>false],['text'=>'A × A^T is not always symmetric','correct'=>false]]],
            ],
        ];
    }

    private function matricesQuiz10(): array
    {
        return [
            'title'       => 'Matrices — Practice Set 10',
            'description' => 'Advanced matrices: eigenvalues, rank-nullity, similar matrices',
            'questions'   => [
                ['text'=>'The Cayley-Hamilton theorem states every matrix satisfies:','difficulty'=>'hard','tag'=>'Cayley-Hamilton','explanation'=>'Cayley-Hamilton: every square matrix satisfies its own characteristic equation.','options'=>[['text'=>'Its own characteristic equation','correct'=>true],['text'=>'The equation A² = A','correct'=>false],['text'=>'The equation A + A^T = 0','correct'=>false],['text'=>'det(A) = trace(A)','correct'=>false]]],
                ['text'=>'The eigenvalues of a diagonal matrix are:','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'For a diagonal matrix, the eigenvalues are simply its diagonal entries.','options'=>[['text'=>'Its diagonal entries','correct'=>true],['text'=>'All equal to 1','correct'=>false],['text'=>'All equal to 0','correct'=>false],['text'=>'The sum of its diagonal entries','correct'=>false]]],
                ['text'=>'If λ is an eigenvalue of A with eigenvector v, then:','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'By definition, Av = λv where v is a non-zero vector stretched/scaled by A.','options'=>[['text'=>'Av = λv for a non-zero vector v','correct'=>true],['text'=>'Av = 0','correct'=>false],['text'=>'det(A) = λ','correct'=>false],['text'=>'v = λA','correct'=>false]]],
                ['text'=>'The rank-nullity theorem states: rank(A) + nullity(A) = ?','difficulty'=>'medium','tag'=>'Rank-Nullity','explanation'=>'For an m×n matrix A, rank(A) + nullity(A) = n (the number of columns).','options'=>[['text'=>'Number of columns of A','correct'=>true],['text'=>'Number of rows of A','correct'=>false],['text'=>'det(A)','correct'=>false],['text'=>'trace(A)','correct'=>false]]],
                ['text'=>'Two matrices A and B are similar if:','difficulty'=>'medium','tag'=>'Similar Matrices','explanation'=>'A and B are similar if there exists an invertible P such that B = P^{−1}AP.','options'=>[['text'=>'B = P^{−1}AP for some invertible P','correct'=>true],['text'=>'A = B^T','correct'=>false],['text'=>'det(A) = det(B)','correct'=>false],['text'=>'They have the same rank','correct'=>false]]],
                ['text'=>'The nullspace of matrix A consists of:','difficulty'=>'medium','tag'=>'Nullspace','explanation'=>'The null space (kernel) of A is the set of all vectors x such that Ax = 0.','options'=>[['text'=>'All vectors x such that Ax = 0','correct'=>true],['text'=>'All vectors x such that Ax = b (b ≠ 0)','correct'=>false],['text'=>'All rows of A','correct'=>false],['text'=>'The zero vector only','correct'=>false]]],
                ['text'=>'For an n×n matrix, the number of eigenvalues counting multiplicity is:','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'The characteristic polynomial of an n×n matrix has degree n, giving n eigenvalues (counting multiplicity, possibly complex).','options'=>[['text'=>'n','correct'=>true],['text'=>'1','correct'=>false],['text'=>'n²','correct'=>false],['text'=>'Equal to the rank','correct'=>false]]],
                ['text'=>'The trace of A equals:','difficulty'=>'medium','tag'=>'Trace and Eigenvalues','explanation'=>'A fundamental result: tr(A) equals the sum of all eigenvalues of A (counting multiplicity).','options'=>[['text'=>'The sum of eigenvalues of A','correct'=>true],['text'=>'The product of eigenvalues','correct'=>false],['text'=>'The determinant of A','correct'=>false],['text'=>'The largest eigenvalue','correct'=>false]]],
                ['text'=>'The determinant of A equals:','difficulty'=>'medium','tag'=>'Determinant and Eigenvalues','explanation'=>'det(A) equals the product of all eigenvalues of A (counting multiplicity).','options'=>[['text'=>'The product of eigenvalues of A','correct'=>true],['text'=>'The sum of eigenvalues','correct'=>false],['text'=>'The trace of A','correct'=>false],['text'=>'The rank of A','correct'=>false]]],
                ['text'=>'The characteristic polynomial of A = [[3,1],[0,2]] is:','difficulty'=>'hard','tag'=>'Characteristic Polynomial','explanation'=>'det(A−λI) = det([[3−λ,1],[0,2−λ]]) = (3−λ)(2−λ) = λ²−5λ+6.','options'=>[['text'=>'λ² − 5λ + 6','correct'=>true],['text'=>'λ² + 5λ + 6','correct'=>false],['text'=>'λ² − 6','correct'=>false],['text'=>'(λ−3)(λ+2)','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz2(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 2',
            'description' => '2×2 determinant practice',
            'questions'   => [
                ['text'=>'What is det([[5,2],[3,4]])?','difficulty'=>'easy','tag'=>'2×2 Determinant','explanation'=>'det = ad−bc = 5×4 − 2×3 = 20 − 6 = 14.','options'=>[['text'=>'14','correct'=>true],['text'=>'8','correct'=>false],['text'=>'26','correct'=>false],['text'=>'11','correct'=>false]]],
                ['text'=>'What is det([[−1,2],[3,−4]])?','difficulty'=>'easy','tag'=>'2×2 Determinant','explanation'=>'det = (−1)(−4) − (2)(3) = 4 − 6 = −2.','options'=>[['text'=>'−2','correct'=>true],['text'=>'2','correct'=>false],['text'=>'10','correct'=>false],['text'=>'−10','correct'=>false]]],
                ['text'=>'det([[a,b],[ka,kb]]) = ?','difficulty'=>'medium','tag'=>'Row Proportionality','explanation'=>'The rows are proportional (row 2 = k × row 1), so the determinant is 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'k','correct'=>false],['text'=>'ab','correct'=>false],['text'=>'k(ab)','correct'=>false]]],
                ['text'=>'For A = [[cosθ,−sinθ],[sinθ,cosθ]], det(A) = ?','difficulty'=>'medium','tag'=>'Rotation Matrix','explanation'=>'det = cos²θ + sin²θ = 1 by the Pythagorean identity.','options'=>[['text'=>'1','correct'=>true],['text'=>'0','correct'=>false],['text'=>'cos2θ','correct'=>false],['text'=>'−1','correct'=>false]]],
                ['text'=>'det([[7,0],[0,3]]) = ?','difficulty'=>'easy','tag'=>'Diagonal Determinant','explanation'=>'For a diagonal 2×2 matrix, det = product of diagonal entries = 7×3 = 21.','options'=>[['text'=>'21','correct'=>true],['text'=>'10','correct'=>false],['text'=>'0','correct'=>false],['text'=>'4','correct'=>false]]],
                ['text'=>'det([[2,4],[1,2]]) = ?','difficulty'=>'easy','tag'=>'2×2 Determinant','explanation'=>'det = 2×2 − 4×1 = 4 − 4 = 0. The rows are proportional.','options'=>[['text'=>'0','correct'=>true],['text'=>'4','correct'=>false],['text'=>'8','correct'=>false],['text'=>'−4','correct'=>false]]],
                ['text'=>'If det(A) = 3 and det(B) = 2, what is det(AB)?','difficulty'=>'easy','tag'=>'Multiplicative Property','explanation'=>'det(AB) = det(A) × det(B) = 3 × 2 = 6.','options'=>[['text'=>'6','correct'=>true],['text'=>'5','correct'=>false],['text'=>'9','correct'=>false],['text'=>'12','correct'=>false]]],
                ['text'=>'What is det(A²) if det(A) = 5?','difficulty'=>'medium','tag'=>'Determinant Power','explanation'=>'det(A²) = det(A×A) = det(A)×det(A) = 5² = 25.','options'=>[['text'=>'25','correct'=>true],['text'=>'10','correct'=>false],['text'=>'5','correct'=>false],['text'=>'50','correct'=>false]]],
                ['text'=>'det([[3,−2],[−6,4]]) = ?','difficulty'=>'easy','tag'=>'2×2 Determinant','explanation'=>'det = 3×4 − (−2)(−6) = 12 − 12 = 0. Rows are proportional.','options'=>[['text'=>'0','correct'=>true],['text'=>'12','correct'=>false],['text'=>'−12','correct'=>false],['text'=>'6','correct'=>false]]],
                ['text'=>'If det([[x,3],[2,x]]) = 10, what are the values of x?','difficulty'=>'hard','tag'=>'Determinant Equation','explanation'=>'x² − 6 = 10 → x² = 16 → x = ±4.','options'=>[['text'=>'x = 4 or x = −4','correct'=>true],['text'=>'x = 4 only','correct'=>false],['text'=>'x = 2 or x = −2','correct'=>false],['text'=>'x = 10/3','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz3(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 3',
            'description' => '3×3 determinant practice',
            'questions'   => [
                ['text'=>'det([[1,0,0],[0,2,0],[0,0,3]]) = ?','difficulty'=>'easy','tag'=>'Diagonal Determinant','explanation'=>'For a diagonal matrix, det = product of diagonal entries = 1×2×3 = 6.','options'=>[['text'=>'6','correct'=>true],['text'=>'0','correct'=>false],['text'=>'1','correct'=>false],['text'=>'3','correct'=>false]]],
                ['text'=>'Using Sarrus\' rule on a 3×3 matrix, how many terms are computed?','difficulty'=>'easy','tag'=>'Sarrus Rule','explanation'=>'Sarrus\' rule computes 6 terms: 3 positive (main diagonals) and 3 negative (anti-diagonals).','options'=>[['text'=>'6 (3 positive, 3 negative)','correct'=>true],['text'=>'4','correct'=>false],['text'=>'3','correct'=>false],['text'=>'9','correct'=>false]]],
                ['text'=>'det([[1,2,3],[4,5,6],[7,8,9]]) = ?','difficulty'=>'medium','tag'=>'3×3 Determinant','explanation'=>'The rows are in arithmetic progression and are linearly dependent, so det = 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'1','correct'=>false],['text'=>'−6','correct'=>false],['text'=>'45','correct'=>false]]],
                ['text'=>'det([[2,0,0],[1,3,0],[4,5,6]]) = ?','difficulty'=>'medium','tag'=>'Triangular Determinant','explanation'=>'Lower triangular matrix: det = product of diagonal entries = 2×3×6 = 36.','options'=>[['text'=>'36','correct'=>true],['text'=>'6','correct'=>false],['text'=>'0','correct'=>false],['text'=>'11','correct'=>false]]],
                ['text'=>'If a 3×3 matrix has two identical rows, its determinant is:','difficulty'=>'easy','tag'=>'Determinant Properties','explanation'=>'Linearly dependent rows (identical rows are a special case) make det = 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'1','correct'=>false],['text'=>'Product of diagonal entries','correct'=>false],['text'=>'Undefined','correct'=>false]]],
                ['text'=>'det([[0,0,1],[0,1,0],[1,0,0]]) = ?','difficulty'=>'hard','tag'=>'Permutation Matrix','explanation'=>'This is the reverse-identity permutation matrix. It represents an odd permutation (3 row swaps from I), so det = −1.','options'=>[['text'=>'−1','correct'=>true],['text'=>'1','correct'=>false],['text'=>'0','correct'=>false],['text'=>'3','correct'=>false]]],
                ['text'=>'If a row of a matrix is multiplied by scalar k, the determinant is:','difficulty'=>'easy','tag'=>'Scalar Row','explanation'=>'Multiplying one row by k multiplies the determinant by k.','options'=>[['text'=>'Multiplied by k','correct'=>true],['text'=>'Added by k','correct'=>false],['text'=>'Unchanged','correct'=>false],['text'=>'Divided by k','correct'=>false]]],
                ['text'=>'det([[2,1,3],[0,4,5],[0,0,6]]) = ?','difficulty'=>'medium','tag'=>'Triangular Determinant','explanation'=>'Upper triangular matrix: det = product of diagonal = 2×4×6 = 48.','options'=>[['text'=>'48','correct'=>true],['text'=>'11','correct'=>false],['text'=>'0','correct'=>false],['text'=>'60','correct'=>false]]],
                ['text'=>'For which matrix is cofactor expansion along a column with a zero MOST efficient?','difficulty'=>'medium','tag'=>'Cofactor Expansion','explanation'=>'Expanding along a row or column with the most zeros reduces the number of sub-determinants to compute.','options'=>[['text'=>'A column or row containing the most zeros','correct'=>true],['text'=>'Always the first column','correct'=>false],['text'=>'The main diagonal','correct'=>false],['text'=>'Any row gives equal efficiency','correct'=>false]]],
                ['text'=>'For A = [[1,2,0],[3,1,4],[0,2,1]], which row gives the easiest cofactor expansion?','difficulty'=>'medium','tag'=>'Cofactor Expansion','explanation'=>'Row 1 contains a zero (entry (1,3)=0), so expanding along it requires computing only 2 sub-determinants instead of 3.','options'=>[['text'=>'Row 1 (contains a zero)','correct'=>true],['text'=>'Row 2','correct'=>false],['text'=>'Row 3','correct'=>false],['text'=>'Any row is equally easy','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz4(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 4',
            'description' => 'Cofactor expansion and adjugate',
            'questions'   => [
                ['text'=>'The minor M_{ij} of element a_{ij} is:','difficulty'=>'medium','tag'=>'Minors','explanation'=>'The minor M_{ij} is the determinant of the submatrix obtained by deleting row i and column j.','options'=>[['text'=>'The determinant of the matrix with row i and column j deleted','correct'=>true],['text'=>'The element at position (i,j)','correct'=>false],['text'=>'The cofactor times (−1)^{i+j}','correct'=>false],['text'=>'The sum of elements in row i','correct'=>false]]],
                ['text'=>'The cofactor C_{ij} = ?','difficulty'=>'medium','tag'=>'Cofactors','explanation'=>'C_{ij} = (−1)^{i+j} × M_{ij}, where M_{ij} is the corresponding minor.','options'=>[['text'=>'(−1)^{i+j} × M_{ij}','correct'=>true],['text'=>'(−1)^{i+j} / M_{ij}','correct'=>false],['text'=>'M_{ij}','correct'=>false],['text'=>'(−1)^i × M_{ij}','correct'=>false]]],
                ['text'=>'At position (2,3), the sign factor (−1)^{i+j} is:','difficulty'=>'easy','tag'=>'Cofactors','explanation'=>'(−1)^{2+3} = (−1)^5 = −1.','options'=>[['text'=>'−1','correct'=>true],['text'=>'+1','correct'=>false],['text'=>'0','correct'=>false],['text'=>'Depends on the matrix','correct'=>false]]],
                ['text'=>'The cofactor expansion along any row or column gives:','difficulty'=>'easy','tag'=>'Cofactor Expansion','explanation'=>'A key theorem: cofactor expansion along any row or column always produces the same determinant.','options'=>[['text'=>'The same determinant value','correct'=>true],['text'=>'Different values depending on the row/column','correct'=>false],['text'=>'The sum of all elements','correct'=>false],['text'=>'The trace','correct'=>false]]],
                ['text'=>'For a 3×3 matrix, how many cofactors are needed for one-row expansion?','difficulty'=>'easy','tag'=>'Cofactor Expansion','explanation'=>'A row has 3 entries, so expanding along one row requires 3 cofactors.','options'=>[['text'=>'3','correct'=>true],['text'=>'9','correct'=>false],['text'=>'6','correct'=>false],['text'=>'1','correct'=>false]]],
                ['text'=>'The adjugate (adjoint) matrix adj(A) has entries:','difficulty'=>'medium','tag'=>'Adjugate','explanation'=>'The adjugate is the transpose of the cofactor matrix: adj(A)_{ij} = C_{ji}.','options'=>[['text'=>'C_{ji} (transposed cofactors)','correct'=>true],['text'=>'C_{ij}','correct'=>false],['text'=>'M_{ij}','correct'=>false],['text'=>'a_{ij}/det(A)','correct'=>false]]],
                ['text'=>'The formula A^{−1} = ?','difficulty'=>'medium','tag'=>'Inverse via Adjugate','explanation'=>'A^{−1} = (1/det(A)) × adj(A). This requires det(A) ≠ 0.','options'=>[['text'=>'(1/det(A)) × adj(A)','correct'=>true],['text'=>'det(A) × adj(A)','correct'=>false],['text'=>'adj(A) / trace(A)','correct'=>false],['text'=>'adj(A) alone','correct'=>false]]],
                ['text'=>'If C_{11}=4, C_{12}=−2, C_{13}=1 and the first row is [3,0,5], what is det(A)?','difficulty'=>'hard','tag'=>'Cofactor Expansion','explanation'=>'det = 3×4 + 0×(−2) + 5×1 = 12 + 0 + 5 = 17.','options'=>[['text'=>'17','correct'=>true],['text'=>'12','correct'=>false],['text'=>'3','correct'=>false],['text'=>'5','correct'=>false]]],
                ['text'=>'The cofactor matrix of A is:','difficulty'=>'medium','tag'=>'Cofactor Matrix','explanation'=>'The cofactor matrix contains all cofactors C_{ij} of A. Its transpose is the adjugate.','options'=>[['text'=>'The matrix of all cofactors C_{ij}','correct'=>true],['text'=>'The adjugate matrix','correct'=>false],['text'=>'The inverse of A','correct'=>false],['text'=>'The transpose of A','correct'=>false]]],
                ['text'=>'Using cofactor expansion on the first row of A = [[1,2,3],[0,4,5],[1,0,6]], what is cofactor C_{11}?','difficulty'=>'hard','tag'=>'Cofactor Expansion','explanation'=>'C_{11} = (+1)×det([[4,5],[0,6]]) = 4×6 − 5×0 = 24.','options'=>[['text'=>'24','correct'=>true],['text'=>'−24','correct'=>false],['text'=>'12','correct'=>false],['text'=>'20','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz5(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 5',
            'description' => 'Properties of determinants',
            'questions'   => [
                ['text'=>'If matrix A has a row of all zeros, then det(A) = ?','difficulty'=>'easy','tag'=>'Determinant Properties','explanation'=>'A zero row makes the rows linearly dependent, so det(A) = 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'1','correct'=>false],['text'=>'Undefined','correct'=>false],['text'=>'Sum of other rows','correct'=>false]]],
                ['text'=>'Is det(A + B) = det(A) + det(B) always true?','difficulty'=>'medium','tag'=>'Determinant Properties','explanation'=>'No — the determinant is NOT additive in general. det(A+B) ≠ det(A)+det(B) for most matrices.','options'=>[['text'=>'No, this is false in general','correct'=>true],['text'=>'Yes, always','correct'=>false],['text'=>'Yes, when A is symmetric','correct'=>false],['text'=>'Yes, when det(A)=det(B)','correct'=>false]]],
                ['text'=>'If B is obtained from A by adding k times row i to row j (i≠j), then det(B) = ?','difficulty'=>'medium','tag'=>'Row Operations','explanation'=>'Adding a multiple of one row to another does not change the determinant.','options'=>[['text'=>'det(A)','correct'=>true],['text'=>'k × det(A)','correct'=>false],['text'=>'det(A) + k','correct'=>false],['text'=>'0','correct'=>false]]],
                ['text'=>'If det(A) = 5 and A is 2×2, what is det(−A)?','difficulty'=>'medium','tag'=>'Scalar Multiple','explanation'=>'det(−A) = (−1)^n det(A). For n=2: (−1)^2 × 5 = 5.','options'=>[['text'=>'5','correct'=>true],['text'=>'−5','correct'=>false],['text'=>'−25','correct'=>false],['text'=>'25','correct'=>false]]],
                ['text'=>'For which n is det(−A) = −det(A)?','difficulty'=>'medium','tag'=>'Scalar Multiple','explanation'=>'det(−A) = (−1)^n det(A). This equals −det(A) when n is odd.','options'=>[['text'=>'When n is odd','correct'=>true],['text'=>'When n is even','correct'=>false],['text'=>'Always','correct'=>false],['text'=>'Never','correct'=>false]]],
                ['text'=>'If A is orthogonal (A^T = A^{−1}), then det(A) = ?','difficulty'=>'hard','tag'=>'Orthogonal Matrix','explanation'=>'det(A)×det(A^T) = det(I) = 1, so (det A)² = 1, giving det(A) = ±1.','options'=>[['text'=>'±1','correct'=>true],['text'=>'0','correct'=>false],['text'=>'1 only','correct'=>false],['text'=>'Any real number','correct'=>false]]],
                ['text'=>'det(A^{−1}) = ?','difficulty'=>'easy','tag'=>'Determinant Properties','explanation'=>'det(A)×det(A^{−1}) = det(I) = 1, so det(A^{−1}) = 1/det(A).','options'=>[['text'=>'1/det(A)','correct'=>true],['text'=>'−det(A)','correct'=>false],['text'=>'det(A)','correct'=>false],['text'=>'1','correct'=>false]]],
                ['text'=>'If all elements of one row are multiplied by scalar k, how does det change?','difficulty'=>'easy','tag'=>'Scalar Row','explanation'=>'Multiplying a single row by k multiplies the entire determinant by k.','options'=>[['text'=>'det is multiplied by k','correct'=>true],['text'=>'det is unchanged','correct'=>false],['text'=>'det is multiplied by k^n','correct'=>false],['text'=>'det is divided by k','correct'=>false]]],
                ['text'=>'For block diagonal matrix [[A,0],[0,B]], det = ?','difficulty'=>'hard','tag'=>'Block Matrix','explanation'=>'det([[A,0],[0,B]]) = det(A) × det(B) for block diagonal matrices.','options'=>[['text'=>'det(A) × det(B)','correct'=>true],['text'=>'det(A) + det(B)','correct'=>false],['text'=>'det(AB)','correct'=>false],['text'=>'0','correct'=>false]]],
                ['text'=>'If A is an n×n matrix with two proportional rows, det(A) = ?','difficulty'=>'easy','tag'=>'Linear Dependence','explanation'=>'Proportional rows are linearly dependent, making the determinant 0.','options'=>[['text'=>'0','correct'=>true],['text'=>'The scalar of proportionality','correct'=>false],['text'=>'1','correct'=>false],['text'=>'n','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz6(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 6',
            'description' => 'Determinants and invertibility',
            'questions'   => [
                ['text'=>'A 3×3 matrix with det = 8 is:','difficulty'=>'easy','tag'=>'Invertibility','explanation'=>'A non-zero determinant means the matrix is non-singular (invertible).','options'=>[['text'=>'Invertible','correct'=>true],['text'=>'Singular','correct'=>false],['text'=>'Has no inverse','correct'=>false],['text'=>'Has eigenvalue 0','correct'=>false]]],
                ['text'=>'The system Ax = 0 has a non-trivial solution if and only if:','difficulty'=>'medium','tag'=>'Homogeneous System','explanation'=>'Ax=0 has non-trivial solutions iff det(A) = 0 (A is singular).','options'=>[['text'=>'det(A) = 0','correct'=>true],['text'=>'det(A) ≠ 0','correct'=>false],['text'=>'A is invertible','correct'=>false],['text'=>'A is symmetric','correct'=>false]]],
                ['text'=>'If det(A) = 12 and det(B) = 3, what is det(A^{−1}B)?','difficulty'=>'medium','tag'=>'Determinant Calculation','explanation'=>'det(A^{−1}B) = det(A^{−1})×det(B) = (1/12)×3 = 1/4.','options'=>[['text'=>'1/4','correct'=>true],['text'=>'4','correct'=>false],['text'=>'36','correct'=>false],['text'=>'1/36','correct'=>false]]],
                ['text'=>'A square matrix A is invertible if and only if:','difficulty'=>'easy','tag'=>'Invertibility','explanation'=>'The fundamental invertibility criterion: A is invertible iff det(A) ≠ 0.','options'=>[['text'=>'det(A) ≠ 0','correct'=>true],['text'=>'A is symmetric','correct'=>false],['text'=>'All diagonal entries are non-zero','correct'=>false],['text'=>'A is upper triangular','correct'=>false]]],
                ['text'=>'If det(A) = 0, which statement is TRUE?','difficulty'=>'medium','tag'=>'Singular Matrix','explanation'=>'det(A) = 0 means the columns (and rows) are linearly dependent.','options'=>[['text'=>'The columns of A are linearly dependent','correct'=>true],['text'=>'A has a unique inverse','correct'=>false],['text'=>'Ax=b always has a unique solution','correct'=>false],['text'=>'A is a diagonal matrix','correct'=>false]]],
                ['text'=>'Two n×n matrices with the same determinant are necessarily:','difficulty'=>'medium','tag'=>'Determinant Properties','explanation'=>'Having the same determinant does not make two matrices equal, similar, or inverses.','options'=>[['text'=>'Not necessarily related in any special way','correct'=>true],['text'=>'Similar matrices','correct'=>false],['text'=>'Equal matrices','correct'=>false],['text'=>'Inverses of each other','correct'=>false]]],
                ['text'=>'What is det(I_n) for any n?','difficulty'=>'easy','tag'=>'Identity Determinant','explanation'=>'The identity matrix has 1s on the diagonal and 0s elsewhere; det(I_n) = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'n','correct'=>false],['text'=>'0','correct'=>false],['text'=>'n!','correct'=>false]]],
                ['text'=>'If A and B are similar (B = P^{−1}AP), then:','difficulty'=>'medium','tag'=>'Similar Matrices','explanation'=>'Similar matrices have equal determinants: det(B) = det(P^{−1})det(A)det(P) = det(A).','options'=>[['text'=>'det(A) = det(B)','correct'=>true],['text'=>'trace(A) ≠ trace(B)','correct'=>false],['text'=>'det(A) = det(P)','correct'=>false],['text'=>'A = B','correct'=>false]]],
                ['text'=>'For a 2×2 matrix A = [[a,b],[c,d]], det(A^{−1}) = ?','difficulty'=>'medium','tag'=>'Inverse Determinant','explanation'=>'det(A^{−1}) = 1/det(A) = 1/(ad−bc).','options'=>[['text'=>'1/(ad−bc)','correct'=>true],['text'=>'ad−bc','correct'=>false],['text'=>'(ad−bc)²','correct'=>false],['text'=>'−(ad−bc)','correct'=>false]]],
                ['text'=>'If A³ = I, what can det(A) be for a real matrix?','difficulty'=>'hard','tag'=>'Determinant Equation','explanation'=>'(det A)³ = det(I) = 1. The only real cube root of 1 is 1, so det(A) = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'3','correct'=>false],['text'=>'Any real value','correct'=>false],['text'=>'1 or −1','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz7(): array
    {
        return [
            'title'       => "Determinants — Practice Set 7",
            'description' => "Cramer's Rule",
            'questions'   => [
                ["text"=>"Cramer's Rule is applicable when:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"Cramer's Rule requires a square system with det(A) ≠ 0.","options"=>[["text"=>"The system is square and det(A) ≠ 0","correct"=>true],["text"=>"Any system of linear equations","correct"=>false],["text"=>"Only homogeneous systems","correct"=>false],["text"=>"det(A) = 0","correct"=>false]]],
                ["text"=>"In Cramer's Rule, x_i = det(A_i)/det(A), where A_i is:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"A_i is obtained by replacing the i-th column of A with the right-hand side vector b.","options"=>[["text"=>"A with its i-th column replaced by b","correct"=>true],["text"=>"A with its i-th row replaced by b","correct"=>false],["text"=>"A with all entries replaced by b_i","correct"=>false],["text"=>"A multiplied by b","correct"=>false]]],
                ["text"=>"For x + 2y = 4, 3x − y = 5: det(A) = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"det([[1,2],[3,−1]]) = (1)(−1) − (2)(3) = −1 − 6 = −7.","options"=>[["text"=>"−7","correct"=>true],["text"=>"7","correct"=>false],["text"=>"−1","correct"=>false],["text"=>"5","correct"=>false]]],
                ["text"=>"For x + 2y = 4, 3x − y = 5: det(A_1) (replace col 1 with [4,5]) = ?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"det([[4,2],[5,−1]]) = 4×(−1) − 2×5 = −4 − 10 = −14.","options"=>[["text"=>"−14","correct"=>true],["text"=>"14","correct"=>false],["text"=>"−6","correct"=>false],["text"=>"−24","correct"=>false]]],
                ["text"=>"So x = det(A_1)/det(A) = −14/(−7) = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"x = −14 ÷ (−7) = 2.","options"=>[["text"=>"2","correct"=>true],["text"=>"−2","correct"=>false],["text"=>"7","correct"=>false],["text"=>"14","correct"=>false]]],
                ["text"=>"det(A_2) for x + 2y = 4, 3x − y = 5 (replace col 2 with [4,5]) = ?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"det([[1,4],[3,5]]) = 1×5 − 4×3 = 5 − 12 = −7.","options"=>[["text"=>"−7","correct"=>true],["text"=>"7","correct"=>false],["text"=>"17","correct"=>false],["text"=>"−17","correct"=>false]]],
                ["text"=>"y = det(A_2)/det(A) = −7/(−7) = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"y = −7 ÷ (−7) = 1.","options"=>[["text"=>"1","correct"=>true],["text"=>"−1","correct"=>false],["text"=>"7","correct"=>false],["text"=>"−7","correct"=>false]]],
                ["text"=>"For a 3×3 system using Cramer's Rule, how many determinants must be computed?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"You need det(A) plus det(A_1), det(A_2), det(A_3) — a total of 4 determinants.","options"=>[["text"=>"4","correct"=>true],["text"=>"3","correct"=>false],["text"=>"6","correct"=>false],["text"=>"9","correct"=>false]]],
                ["text"=>"When det(A) = 0, Cramer's Rule:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"Cramer's Rule requires det(A) ≠ 0; it cannot be applied when det(A) = 0.","options"=>[["text"=>"Cannot be applied","correct"=>true],["text"=>"Gives x_i = 0 for all i","correct"=>false],["text"=>"Gives infinitely many solutions","correct"=>false],["text"=>"Still works with modification","correct"=>false]]],
                ["text"=>"Cramer's Rule is most practical for:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"For small systems (n=2 or 3), Cramer's Rule is convenient. For large n, Gaussian elimination is more efficient.","options"=>[["text"=>"Small systems (n = 2 or 3)","correct"=>true],["text"=>"Large systems (n > 10)","correct"=>false],["text"=>"Homogeneous systems only","correct"=>false],["text"=>"Systems with integer solutions only","correct"=>false]]],
            ],
        ];
    }

    private function determinantsQuiz8(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 8',
            'description' => 'Area, volume, and geometric applications',
            'questions'   => [
                ['text'=>'The area of the parallelogram formed by vectors [a,b] and [c,d] is:','difficulty'=>'medium','tag'=>'Geometric Application','explanation'=>'The area equals |det([[a,b],[c,d]])| = |ad − bc|.','options'=>[['text'=>'|ad − bc|','correct'=>true],['text'=>'(a+c)(b+d)/2','correct'=>false],['text'=>'a×d + b×c','correct'=>false],['text'=>'√(a²+b²)×√(c²+d²)','correct'=>false]]],
                ['text'=>'Three points P, Q, R are collinear if:','difficulty'=>'medium','tag'=>'Collinearity','explanation'=>'Three points are collinear iff the determinant of the 3×3 matrix formed by [x,y,1] for each point is 0.','options'=>[['text'=>'det([[x_P,y_P,1],[x_Q,y_Q,1],[x_R,y_R,1]]) = 0','correct'=>true],['text'=>'The determinant equals 1','correct'=>false],['text'=>'The determinant is negative','correct'=>false],['text'=>'No determinant test exists','correct'=>false]]],
                ['text'=>'The volume of the parallelepiped formed by three 3D vectors is:','difficulty'=>'medium','tag'=>'Geometric Application','explanation'=>'Volume = |det| of the 3×3 matrix formed by the three vectors as rows (or columns).','options'=>[['text'=>'|det of the 3×3 matrix formed by the vectors|','correct'=>true],['text'=>'Sum of the three vectors\' lengths','correct'=>false],['text'=>'Product of the three vectors\' lengths','correct'=>false],['text'=>'1/3 × base × height','correct'=>false]]],
                ['text'=>'If the determinant of three vectors\' matrix is 0, the vectors are:','difficulty'=>'medium','tag'=>'Linear Dependence','explanation'=>'A zero determinant means the vectors are linearly dependent — they lie in the same plane (coplanar).','options'=>[['text'=>'Coplanar (linearly dependent)','correct'=>true],['text'=>'Orthogonal','correct'=>false],['text'=>'Parallel to the axes','correct'=>false],['text'=>'Forming a unit cube','correct'=>false]]],
                ['text'=>'The area of the triangle with vertices (0,0), (4,0), (0,3) is:','difficulty'=>'medium','tag'=>'Geometric Application','explanation'=>'Area = (1/2)|det([[4,0],[0,3]])| = (1/2)|12| = 6.','options'=>[['text'=>'6','correct'=>true],['text'=>'12','correct'=>false],['text'=>'3','correct'=>false],['text'=>'4','correct'=>false]]],
                ['text'=>'The signed area of the parallelogram spanned by [3,0] and [0,4] is:','difficulty'=>'easy','tag'=>'Geometric Application','explanation'=>'det([[3,0],[0,4]]) = 12. The signed area is 12.','options'=>[['text'=>'12','correct'=>true],['text'=>'6','correct'=>false],['text'=>'7','correct'=>false],['text'=>'24','correct'=>false]]],
                ['text'=>'The determinant is used in change-of-variables for integration via:','difficulty'=>'hard','tag'=>'Jacobian','explanation'=>'The Jacobian determinant appears in the change-of-variables formula for multivariable integrals.','options'=>[['text'=>'The Jacobian','correct'=>true],['text'=>'The gradient','correct'=>false],['text'=>'The Hessian','correct'=>false],['text'=>'The Laplacian','correct'=>false]]],
                ['text'=>'In 3D, three vectors are linearly independent if:','difficulty'=>'medium','tag'=>'Linear Independence','explanation'=>'Three 3D vectors are linearly independent iff the determinant of the matrix they form is non-zero.','options'=>[['text'=>'Their determinant is non-zero','correct'=>true],['text'=>'Their sum is zero','correct'=>false],['text'=>'They are mutually perpendicular','correct'=>false],['text'=>'Each vector has unit length','correct'=>false]]],
                ['text'=>'det([[a,b],[c,d]]) = 0 geometrically means the vectors [a,b] and [c,d]:','difficulty'=>'medium','tag'=>'Geometric Interpretation','explanation'=>'A zero determinant means the two vectors are parallel (collinear), spanning no area.','options'=>[['text'=>'Are parallel (collinear)','correct'=>true],['text'=>'Are perpendicular','correct'=>false],['text'=>'Have the same length','correct'=>false],['text'=>'Form a unit square','correct'=>false]]],
                ['text'=>'If four points in 3D are coplanar, the determinant of their coordinate matrix (with 1s appended) is:','difficulty'=>'hard','tag'=>'Coplanarity','explanation'=>'Four coplanar points give a linearly dependent set, making the 4×4 determinant zero.','options'=>[['text'=>'0','correct'=>true],['text'=>'1','correct'=>false],['text'=>'4','correct'=>false],['text'=>'Non-zero','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz9(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 9',
            'description' => 'Mixed determinant problems',
            'questions'   => [
                ['text'=>'For A = [[1,2],[3,4]] and B = I₂ (2×2 identity), det(A + B) = ?','difficulty'=>'medium','tag'=>'Mixed','explanation'=>'A+B = [[2,2],[3,5]], det = 2×5 − 2×3 = 10 − 6 = 4. Note: det(A)+det(B) = −2+1 = −1 ≠ 4.','options'=>[['text'=>'4','correct'=>true],['text'=>'−1','correct'=>false],['text'=>'2','correct'=>false],['text'=>'−2','correct'=>false]]],
                ['text'=>'If A = [[k,2],[8,k]], for what values of k is A singular?','difficulty'=>'medium','tag'=>'Singular Condition','explanation'=>'det = k²−16 = 0 → k = ±4.','options'=>[['text'=>'k = 4 or k = −4','correct'=>true],['text'=>'k = 2 or k = −2','correct'=>false],['text'=>'k = 0','correct'=>false],['text'=>'k = 8','correct'=>false]]],
                ['text'=>'det([[a,0,0],[b,c,0],[d,e,f]]) = ?','difficulty'=>'easy','tag'=>'Triangular Determinant','explanation'=>'Lower triangular: det = product of diagonal entries = a×c×f.','options'=>[['text'=>'acf','correct'=>true],['text'=>'a+c+f','correct'=>false],['text'=>'abc','correct'=>false],['text'=>'def','correct'=>false]]],
                ['text'=>'For square A and B with det(A)=2 and det(B)=3, det(A²B³) = ?','difficulty'=>'hard','tag'=>'Determinant Laws','explanation'=>'det(A²B³) = det(A)²×det(B)³ = 4×27 = 108.','options'=>[['text'=>'108','correct'=>true],['text'=>'12','correct'=>false],['text'=>'36','correct'=>false],['text'=>'54','correct'=>false]]],
                ['text'=>'If row 2 of A is replaced by (row 2 + 3×row 1), det changes by:','difficulty'=>'easy','tag'=>'Row Operations','explanation'=>'Adding a multiple of one row to another does not change the determinant.','options'=>[['text'=>'No change — det stays the same','correct'=>true],['text'=>'det is tripled','correct'=>false],['text'=>'det decreases by 3','correct'=>false],['text'=>'det is multiplied by 3','correct'=>false]]],
                ['text'=>'det([[1,2,3],[0,4,5],[0,0,6]]) + det([[2,0,0],[1,3,0],[4,5,6]]) = ?','difficulty'=>'medium','tag'=>'Triangular Determinant','explanation'=>'First (upper triangular): 1×4×6=24. Second (lower triangular): 2×3×6=36. Sum: 60.','options'=>[['text'=>'60','correct'=>true],['text'=>'24','correct'=>false],['text'=>'36','correct'=>false],['text'=>'108','correct'=>false]]],
                ['text'=>'If A = [[2,1],[1,2]] and B = A^T, what is det(AB)?','difficulty'=>'medium','tag'=>'Mixed','explanation'=>'det(A)=4−1=3, det(B)=det(A^T)=det(A)=3. det(AB)=9.','options'=>[['text'=>'9','correct'=>true],['text'=>'3','correct'=>false],['text'=>'6','correct'=>false],['text'=>'12','correct'=>false]]],
                ['text'=>'det([[1,0,2],[0,1,3],[0,0,1]]) = ?','difficulty'=>'easy','tag'=>'Triangular Determinant','explanation'=>'Upper triangular: det = 1×1×1 = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'5','correct'=>false],['text'=>'2','correct'=>false],['text'=>'0','correct'=>false]]],
                ['text'=>'For A = [[0,1],[−1,0]] (90° rotation), det(A) = ?','difficulty'=>'easy','tag'=>'Rotation Matrix','explanation'=>'det = 0×0 − 1×(−1) = 0+1 = 1. Rotation matrices always have det = ±1.','options'=>[['text'=>'1','correct'=>true],['text'=>'−1','correct'=>false],['text'=>'0','correct'=>false],['text'=>'2','correct'=>false]]],
                ['text'=>'A = [[1,2],[3,6]]. det(A + A^T) = ?','difficulty'=>'hard','tag'=>'Mixed','explanation'=>'A^T = [[1,3],[2,6]]. A+A^T = [[2,5],[5,12]]. det = 2×12−5×5 = 24−25 = −1.','options'=>[['text'=>'−1','correct'=>true],['text'=>'0','correct'=>false],['text'=>'2','correct'=>false],['text'=>'12','correct'=>false]]],
            ],
        ];
    }

    private function determinantsQuiz10(): array
    {
        return [
            'title'       => 'Determinants — Practice Set 10',
            'description' => 'Advanced: characteristic polynomial and eigenvalues',
            'questions'   => [
                ['text'=>'The characteristic polynomial of A = [[3,1],[0,2]] is:','difficulty'=>'hard','tag'=>'Characteristic Polynomial','explanation'=>'det(A−λI) = (3−λ)(2−λ) − 0 = λ²−5λ+6.','options'=>[['text'=>'λ²−5λ+6','correct'=>true],['text'=>'λ²+5λ+6','correct'=>false],['text'=>'λ²−6','correct'=>false],['text'=>'(λ−3)(λ+2)','correct'=>false]]],
                ['text'=>'The eigenvalues of A = [[3,1],[0,2]] are:','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'From the characteristic polynomial λ²−5λ+6 = (λ−3)(λ−2) = 0, eigenvalues are 3 and 2.','options'=>[['text'=>'3 and 2','correct'=>true],['text'=>'−3 and −2','correct'=>false],['text'=>'1 and 0','correct'=>false],['text'=>'5 and 1','correct'=>false]]],
                ['text'=>'det(A − λI) = 0 means λ is:','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'The equation det(A−λI) = 0 is the characteristic equation; its solutions are the eigenvalues.','options'=>[['text'=>'An eigenvalue of A','correct'=>true],['text'=>'The trace of A','correct'=>false],['text'=>'The rank of A','correct'=>false],['text'=>'Undefined','correct'=>false]]],
                ['text'=>'For a 3×3 matrix, the characteristic polynomial has degree:','difficulty'=>'easy','tag'=>'Characteristic Polynomial','explanation'=>'The characteristic polynomial of an n×n matrix has degree n. For 3×3, degree = 3.','options'=>[['text'=>'3','correct'=>true],['text'=>'2','correct'=>false],['text'=>'6','correct'=>false],['text'=>'9','correct'=>false]]],
                ['text'=>'det([[a,b,c],[d,e,f],[g,h,i]]) = a(ei−fh) − b(di−fg) + c(dh−eg). This is expansion along:','difficulty'=>'easy','tag'=>'Cofactor Expansion','explanation'=>'This formula represents cofactor expansion along the first row.','options'=>[['text'=>'The first row','correct'=>true],['text'=>'The first column','correct'=>false],['text'=>'The main diagonal','correct'=>false],['text'=>'The last row','correct'=>false]]],
                ['text'=>'The permanent of a matrix differs from the determinant because:','difficulty'=>'hard','tag'=>'Permanent','explanation'=>'The permanent uses only positive signs (no alternating ±), unlike the determinant.','options'=>[['text'=>'All signs are positive (no alternating signs)','correct'=>true],['text'=>'Rows and columns are swapped','correct'=>false],['text'=>'It equals the trace','correct'=>false],['text'=>'It only exists for 2×2 matrices','correct'=>false]]],
                ['text'=>'If det(A−λI) = λ²−5λ+6, what are the eigenvalues?','difficulty'=>'medium','tag'=>'Eigenvalues','explanation'=>'Factor: (λ−3)(λ−2) = 0, so λ = 3 or λ = 2.','options'=>[['text'=>'3 and 2','correct'=>true],['text'=>'5 and 6','correct'=>false],['text'=>'−3 and −2','correct'=>false],['text'=>'1 and 6','correct'=>false]]],
                ['text'=>'det(A + B) = det(A) + det(B) is:','difficulty'=>'easy','tag'=>'Determinant Properties','explanation'=>'This is false in general. The determinant is NOT additive.','options'=>[['text'=>'False in general','correct'=>true],['text'=>'True always','correct'=>false],['text'=>'True when A is symmetric','correct'=>false],['text'=>'True when det(A)=det(B)','correct'=>false]]],
                ['text'=>'For the equation det([[1,2],[3,k]]) = det([[k,1],[2,3]]), what is k?','difficulty'=>'hard','tag'=>'Determinant Equation','explanation'=>'k−6 = 3k−2 → −4 = 2k → k = −2.','options'=>[['text'=>'−2','correct'=>true],['text'=>'2','correct'=>false],['text'=>'4','correct'=>false],['text'=>'0','correct'=>false]]],
                ['text'=>'Which theorem says every matrix satisfies its own characteristic equation?','difficulty'=>'medium','tag'=>'Cayley-Hamilton','explanation'=>'The Cayley-Hamilton theorem states that every square matrix satisfies its own characteristic polynomial.','options'=>[['text'=>'Cayley-Hamilton theorem','correct'=>true],['text'=>'Rank-nullity theorem','correct'=>false],['text'=>'Spectral theorem','correct'=>false],['text'=>'Rouché-Capelli theorem','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz2(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 2',
            'description' => 'Setting up and understanding linear systems',
            'questions'   => [
                ['text'=>'The system 2x + 3y = 7, x − y = 1 as a matrix equation AX = B has A equal to:','difficulty'=>'easy','tag'=>'Augmented Matrix','explanation'=>'The coefficient matrix A uses the coefficients of x and y from each equation: [[2,3],[1,−1]].','options'=>[['text'=>'[[2,3],[1,−1]]','correct'=>true],['text'=>'[[2,3,7],[1,−1,1]]','correct'=>false],['text'=>'[[7],[1]]','correct'=>false],['text'=>'[[2,1],[3,−1]]','correct'=>false]]],
                ['text'=>'The augmented matrix for 3x − y = 5, 2x + 4y = 8 is:','difficulty'=>'easy','tag'=>'Augmented Matrix','explanation'=>'The augmented matrix is the coefficient matrix with the RHS appended as an extra column.','options'=>[['text'=>'[[3,−1,5],[2,4,8]]','correct'=>true],['text'=>'[[3,−1],[2,4]]','correct'=>false],['text'=>'[[5],[8]]','correct'=>false],['text'=>'[[3,2,−1,4]]','correct'=>false]]],
                ['text'=>'A 3×4 augmented matrix represents:','difficulty'=>'easy','tag'=>'Augmented Matrix','explanation'=>'3 rows → 3 equations; 4 columns means 3 variable columns + 1 RHS column = 3 unknowns.','options'=>[['text'=>'3 equations, 3 unknowns','correct'=>true],['text'=>'4 equations, 3 unknowns','correct'=>false],['text'=>'3 equations, 4 unknowns','correct'=>false],['text'=>'4 equations, 4 unknowns','correct'=>false]]],
                ['text'=>'"Overdetermined" means a system has:','difficulty'=>'easy','tag'=>'System Classification','explanation'=>'An overdetermined system has more equations than unknowns.','options'=>[['text'=>'More equations than unknowns','correct'=>true],['text'=>'More unknowns than equations','correct'=>false],['text'=>'Equal equations and unknowns','correct'=>false],['text'=>'A unique solution','correct'=>false]]],
                ['text'=>'If a system has 2 equations and 3 unknowns, it has:','difficulty'=>'medium','tag'=>'Underdetermined Systems','explanation'=>'An underdetermined system has either no solution or infinitely many (never a unique solution).','options'=>[['text'=>'Either no solution or infinitely many solutions','correct'=>true],['text'=>'Always a unique solution','correct'=>false],['text'=>'Always no solution','correct'=>false],['text'=>'Exactly two solutions','correct'=>false]]],
                ['text'=>'The coefficient matrix does NOT include:','difficulty'=>'easy','tag'=>'Augmented Matrix','explanation'=>'The coefficient matrix contains only the variable coefficients; the RHS constants go in the augmented column.','options'=>[['text'=>'The right-hand side constants','correct'=>true],['text'=>'The variable coefficients','correct'=>false],['text'=>'Any zeros','correct'=>false],['text'=>'The unknowns\' coefficients','correct'=>false]]],
                ['text'=>'Does x=2, y=−1, z=3 satisfy 2x − y + z = 8?','difficulty'=>'easy','tag'=>'Verification','explanation'=>'2(2) − (−1) + 3 = 4 + 1 + 3 = 8. Yes, it satisfies the equation.','options'=>[['text'=>'Yes, 2(2)−(−1)+3 = 8','correct'=>true],['text'=>'No, it gives 4','correct'=>false],['text'=>'No, it gives 6','correct'=>false],['text'=>'No, it gives 2','correct'=>false]]],
                ['text'=>'A consistent, dependent system has:','difficulty'=>'easy','tag'=>'Solution Types','explanation'=>'A consistent dependent system has infinitely many solutions (redundant equations).','options'=>[['text'=>'Infinitely many solutions','correct'=>true],['text'=>'Exactly one solution','correct'=>false],['text'=>'Zero solutions','correct'=>false],['text'=>'Two solutions','correct'=>false]]],
                ['text'=>'The augmented matrix [[1,0,3],[0,1,−2]] in RREF means:','difficulty'=>'easy','tag'=>'RREF Solution','explanation'=>'RREF directly reads: x = 3 and y = −2.','options'=>[['text'=>'x = 3, y = −2','correct'=>true],['text'=>'x = −3, y = 2','correct'=>false],['text'=>'x = 1, y = 0','correct'=>false],['text'=>'x = 0, y = 0','correct'=>false]]],
                ['text'=>'A free variable in a linear system corresponds to:','difficulty'=>'medium','tag'=>'Free Variables','explanation'=>'A free variable corresponds to a column without a pivot in the coefficient matrix.','options'=>[['text'=>'A column without a pivot in the coefficient matrix','correct'=>true],['text'=>'A variable equal to zero','correct'=>false],['text'=>'The right-hand side','correct'=>false],['text'=>'A row of zeros with non-zero RHS','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz3(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 3',
            'description' => 'Gaussian elimination steps',
            'questions'   => [
                ['text'=>'Gaussian elimination transforms a matrix into:','difficulty'=>'easy','tag'=>'Gaussian Elimination','explanation'=>'Gaussian elimination produces row echelon form (REF), not RREF.','options'=>[['text'=>'Row echelon form (REF)','correct'=>true],['text'=>'Reduced row echelon form (RREF)','correct'=>false],['text'=>'Diagonal form','correct'=>false],['text'=>'Identity matrix','correct'=>false]]],
                ['text'=>'Gauss-Jordan elimination goes further than Gaussian to produce:','difficulty'=>'easy','tag'=>'Gauss-Jordan','explanation'=>'Gauss-Jordan continues after REF to eliminate entries above pivots too, reaching RREF.','options'=>[['text'=>'Reduced row echelon form (RREF)','correct'=>true],['text'=>'Row echelon form only','correct'=>false],['text'=>'Lower triangular form','correct'=>false],['text'=>'Diagonal form','correct'=>false]]],
                ['text'=>'To eliminate x from row 2 of [[2,4,−2],[1,3,1]], the row operation is:','difficulty'=>'medium','tag'=>'Row Operations','explanation'=>'To zero out the leading 2 in row 2, apply R2 ← R2 − (1/2)R1.','options'=>[['text'=>'R2 ← R2 − (1/2)R1','correct'=>true],['text'=>'R1 ← R1 − R2','correct'=>false],['text'=>'R2 ← R2 × 2','correct'=>false],['text'=>'R2 ← (1/2)R2','correct'=>false]]],
                ['text'=>'After Gaussian elimination (REF), the solution is found by:','difficulty'=>'easy','tag'=>'Back-Substitution','explanation'=>'REF is solved by back-substitution, working from the last equation upward.','options'=>[['text'=>'Back substitution','correct'=>true],['text'=>'Forward substitution','correct'=>false],['text'=>'Gauss-Jordan continuation','correct'=>false],['text'=>'Cramer\'s Rule','correct'=>false]]],
                ['text'=>'Which augmented matrix represents an inconsistent system?','difficulty'=>'medium','tag'=>'Inconsistent System','explanation'=>'Row [0,0,5] means 0x+0y = 5, which is impossible. The system is inconsistent.','options'=>[['text'=>'[[1,2,3],[0,0,5]]','correct'=>true],['text'=>'[[1,2,3],[0,1,5]]','correct'=>false],['text'=>'[[1,0,3],[0,1,5]]','correct'=>false],['text'=>'[[0,0,0],[1,2,3]]','correct'=>false]]],
                ['text'=>'The augmented matrix [[1,2,3],[0,0,0]] represents a system with:','difficulty'=>'medium','tag'=>'Infinitely Many Solutions','explanation'=>'The zero row means one equation is redundant; with one equation and two unknowns, infinitely many solutions exist.','options'=>[['text'=>'Infinitely many solutions','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'A unique solution','correct'=>false],['text'=>'Exactly two solutions','correct'=>false]]],
                ['text'=>'Applying R2 ← R2 − 2R1 to [[1,3,5],[2,4,6]] gives:','difficulty'=>'medium','tag'=>'Row Operations','explanation'=>'R2 = [2,4,6] − 2×[1,3,5] = [0,−2,−4]. Result: [[1,3,5],[0,−2,−4]].','options'=>[['text'=>'[[1,3,5],[0,−2,−4]]','correct'=>true],['text'=>'[[1,3,5],[1,1,1]]','correct'=>false],['text'=>'[[1,3,5],[0,4,6]]','correct'=>false],['text'=>'[[2,6,10],[2,4,6]]','correct'=>false]]],
                ['text'=>'Partial pivoting in Gaussian elimination is used to avoid:','difficulty'=>'medium','tag'=>'Pivoting','explanation'=>'Partial pivoting swaps rows to bring the largest absolute value to the pivot position, avoiding division by zero or very small numbers.','options'=>[['text'=>'Division by zero or near-zero pivots','correct'=>true],['text'=>'Non-unit pivots','correct'=>false],['text'=>'Negative pivots','correct'=>false],['text'=>'Non-integer pivots','correct'=>false]]],
                ['text'=>'From [[1,2,3,10],[0,1,4,7],[0,0,2,6]], back-substitution gives z = ?','difficulty'=>'easy','tag'=>'Back-Substitution','explanation'=>'Row 3: 2z = 6 → z = 3.','options'=>[['text'=>'3','correct'=>true],['text'=>'6','correct'=>false],['text'=>'2','correct'=>false],['text'=>'1','correct'=>false]]],
                ['text'=>'Continuing above (z=3): y + 4z = 7 gives y = ?','difficulty'=>'medium','tag'=>'Back-Substitution','explanation'=>'y + 4(3) = 7 → y + 12 = 7 → y = −5.','options'=>[['text'=>'−5','correct'=>true],['text'=>'19','correct'=>false],['text'=>'−1','correct'=>false],['text'=>'7','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz4(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 4',
            'description' => 'Gauss-Jordan elimination and matrix inverse',
            'questions'   => [
                ['text'=>'Gauss-Jordan elimination produces:','difficulty'=>'easy','tag'=>'Gauss-Jordan','explanation'=>'Gauss-Jordan continues beyond REF to create RREF where each pivot column has zeros above and below the pivot.','options'=>[['text'=>'Reduced row echelon form (RREF)','correct'=>true],['text'=>'Row echelon form only','correct'=>false],['text'=>'The inverse of a matrix','correct'=>false],['text'=>'A triangular matrix','correct'=>false]]],
                ['text'=>'In RREF, each leading 1 must have:','difficulty'=>'easy','tag'=>'RREF','explanation'=>'In RREF, each leading 1 is the only non-zero entry in its column.','options'=>[['text'=>'Zeros in all other entries of its column','correct'=>true],['text'=>'Zeros only below it','correct'=>false],['text'=>'1 in all other positions','correct'=>false],['text'=>'No zeros anywhere','correct'=>false]]],
                ['text'=>'Which matrix is in RREF?','difficulty'=>'medium','tag'=>'RREF','explanation'=>'[[1,0,2],[0,1,3]]: both pivots are 1, each is the only non-zero in its column. This is RREF.','options'=>[['text'=>'[[1,0,2],[0,1,3]]','correct'=>true],['text'=>'[[1,2,5],[0,1,3]]','correct'=>false],['text'=>'[[1,0,2],[0,0,1]]','correct'=>false],['text'=>'[[0,1,2],[1,0,3]]','correct'=>false]]],
                ['text'=>'Using Gauss-Jordan on [[2,1,5],[1,−1,1]] gives solution:','difficulty'=>'medium','tag'=>'Gauss-Jordan','explanation'=>'After row ops: x=2, y=1. Verify: 2(2)+1=5 ✓, 2−1=1 ✓.','options'=>[['text'=>'x = 2, y = 1','correct'=>true],['text'=>'x = 1, y = 2','correct'=>false],['text'=>'x = −1, y = 3','correct'=>false],['text'=>'x = 3, y = −1','correct'=>false]]],
                ['text'=>'To find A^{−1} using Gauss-Jordan, augment A with:','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'To find A^{−1}, form the augmented matrix [A|I] and reduce to [I|A^{−1}].','options'=>[['text'=>'The identity matrix I','correct'=>true],['text'=>'A column of zeros','correct'=>false],['text'=>'The determinant of A','correct'=>false],['text'=>'Another copy of A','correct'=>false]]],
                ['text'=>'If Gauss-Jordan on [A|I] produces [I|B], then B is:','difficulty'=>'easy','tag'=>'Matrix Inverse','explanation'=>'The right block becomes A^{−1} when the left block is reduced to I.','options'=>[['text'=>'A^{−1}','correct'=>true],['text'=>'A^T','correct'=>false],['text'=>'adj(A)','correct'=>false],['text'=>'det(A)·I','correct'=>false]]],
                ['text'=>'When can Gauss-Jordan NOT produce an inverse?','difficulty'=>'medium','tag'=>'Matrix Inverse','explanation'=>'If A is singular (det=0), the left block cannot be reduced to I, so no inverse exists.','options'=>[['text'=>'When A is singular (det = 0)','correct'=>true],['text'=>'When A is not symmetric','correct'=>false],['text'=>'When A is upper triangular','correct'=>false],['text'=>'Never — it always works','correct'=>false]]],
                ['text'=>'An advantage of Gauss-Jordan over back-substitution is:','difficulty'=>'medium','tag'=>'Gauss-Jordan','explanation'=>'RREF gives the solution directly without additional back-substitution steps.','options'=>[['text'=>'The solution is read directly without extra computation','correct'=>true],['text'=>'It requires fewer row operations','correct'=>false],['text'=>'It handles non-square systems better','correct'=>false],['text'=>'It avoids numerical round-off errors','correct'=>false]]],
                ['text'=>'Gauss-Jordan applied to [A|I] requires eliminating entries:','difficulty'=>'medium','tag'=>'Gauss-Jordan','explanation'=>'Gauss-Jordan eliminates entries both below AND above each pivot, while Gaussian only eliminates below.','options'=>[['text'=>'Both above and below each pivot','correct'=>true],['text'=>'Only below each pivot','correct'=>false],['text'=>'Only above each pivot','correct'=>false],['text'=>'In the identity block only','correct'=>false]]],
                ['text'=>'For A = [[3,1],[5,2]] and A^{−1} = [[2,−1],[−5,3]], solve AX = [[7],[11]].','difficulty'=>'hard','tag'=>'Inverse Method','explanation'=>'X = A^{−1}B = [[2,−1],[−5,3]][[7],[11]] = [[14−11],[−35+33]] = [[3],[−2]].','options'=>[['text'=>'x = 3, y = −2','correct'=>true],['text'=>'x = −2, y = 3','correct'=>false],['text'=>'x = 7, y = 11','correct'=>false],['text'=>'x = 1, y = 1','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz5(): array
    {
        return [
            'title'       => "Systems of Linear Equations — Practice Set 5",
            'description' => "Cramer's Rule applications",
            'questions'   => [
                ["text"=>"For 2x + y = 7, x − 3y = −5: det(A) = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"det([[2,1],[1,−3]]) = 2×(−3) − 1×1 = −6 − 1 = −7.","options"=>[["text"=>"−7","correct"=>true],["text"=>"7","correct"=>false],["text"=>"−6","correct"=>false],["text"=>"1","correct"=>false]]],
                ["text"=>"For 2x + y = 7, x − 3y = −5: det(A_1) (replace col 1 with [7,−5]) = ?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"det([[7,1],[−5,−3]]) = 7×(−3) − 1×(−5) = −21+5 = −16.","options"=>[["text"=>"−16","correct"=>true],["text"=>"16","correct"=>false],["text"=>"−21","correct"=>false],["text"=>"−11","correct"=>false]]],
                ["text"=>"x = det(A_1)/det(A) = −16/(−7) = ?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"−16 ÷ (−7) = 16/7. This fraction is correct — not all systems have integer solutions.","options"=>[["text"=>"16/7","correct"=>true],["text"=>"7/16","correct"=>false],["text"=>"2","correct"=>false],["text"=>"−16","correct"=>false]]],
                ["text"=>"For the system x + 2y = 4, 3x − y = 5: det(A_2) (replace col 2 with [4,5]) = ?","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"det([[1,4],[3,5]]) = 1×5 − 4×3 = 5 − 12 = −7.","options"=>[["text"=>"−7","correct"=>true],["text"=>"7","correct"=>false],["text"=>"17","correct"=>false],["text"=>"−17","correct"=>false]]],
                ["text"=>"With det(A) = −7 and det(A_2) = −7: y = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"y = det(A_2)/det(A) = (−7)/(−7) = 1.","options"=>[["text"=>"1","correct"=>true],["text"=>"−1","correct"=>false],["text"=>"7","correct"=>false],["text"=>"−7","correct"=>false]]],
                ["text"=>"For a 3×3 system with det(A)=6 and det(A_2)=18, y = ?","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"y = det(A_2)/det(A) = 18/6 = 3.","options"=>[["text"=>"3","correct"=>true],["text"=>"18","correct"=>false],["text"=>"6","correct"=>false],["text"=>"1/3","correct"=>false]]],
                ["text"=>"Cramer's Rule gives the solution directly without:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"Cramer's Rule expresses each variable as a ratio of determinants, requiring no back-substitution.","options"=>[["text"=>"Back substitution","correct"=>true],["text"=>"Computing determinants","correct"=>false],["text"=>"The coefficient matrix","correct"=>false],["text"=>"Right-hand side values","correct"=>false]]],
                ["text"=>"When det(A)=0 and all det(A_i)=0, the system:","difficulty"=>"hard","tag"=>"Cramer's Rule","explanation"=>"If all relevant determinants are 0, the system may have infinitely many solutions or no solution — further analysis is needed.","options"=>[["text"=>"Has infinitely many solutions or no solution (further analysis needed)","correct"=>true],["text"=>"Has a unique solution","correct"=>false],["text"=>"Has no solution","correct"=>false],["text"=>"Has exactly two solutions","correct"=>false]]],
                ["text"=>"Cramer's Rule is computationally inefficient for large n because:","difficulty"=>"medium","tag"=>"Cramer's Rule","explanation"=>"Computing n+1 determinants by cofactor expansion is O(n!) — extremely expensive for large n.","options"=>[["text"=>"Computing many determinants is very expensive (O(n!))","correct"=>true],["text"=>"It does not work for n > 3","correct"=>false],["text"=>"Determinants are always zero for large n","correct"=>false],["text"=>"It requires more memory than the matrix","correct"=>false]]],
                ["text"=>"Cramer's Rule requires the number of equations to equal the number of:","difficulty"=>"easy","tag"=>"Cramer's Rule","explanation"=>"Cramer's Rule applies only to square systems where #equations = #unknowns and det(A) ≠ 0.","options"=>[["text"=>"Unknowns (square system)","correct"=>true],["text"=>"Right-hand side values","correct"=>false],["text"=>"Pivot positions","correct"=>false],["text"=>"Zero entries","correct"=>false]]],
            ],
        ];
    }

    private function systemsQuiz6(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 6',
            'description' => 'Inverse matrix method',
            'questions'   => [
                ['text'=>'The inverse method solves AX = B by giving X = ?','difficulty'=>'easy','tag'=>'Inverse Method','explanation'=>'Pre-multiplying both sides by A^{−1}: X = A^{−1}B.','options'=>[['text'=>'A^{−1}B','correct'=>true],['text'=>'AB^{−1}','correct'=>false],['text'=>'B^{−1}A','correct'=>false],['text'=>'(AB)^{−1}','correct'=>false]]],
                ['text'=>'The inverse method can only be used when:','difficulty'=>'easy','tag'=>'Inverse Method','explanation'=>'A must be square with det(A) ≠ 0 (invertible) for A^{−1} to exist.','options'=>[['text'=>'A is square and invertible','correct'=>true],['text'=>'B is a zero vector','correct'=>false],['text'=>'A is symmetric','correct'=>false],['text'=>'A is upper triangular','correct'=>false]]],
                ['text'=>'For [[2,1],[1,3]]X = [[5],[10]]: det(A) = ?','difficulty'=>'easy','tag'=>'Inverse Method','explanation'=>'det([[2,1],[1,3]]) = 2×3 − 1×1 = 6 − 1 = 5.','options'=>[['text'=>'5','correct'=>true],['text'=>'6','correct'=>false],['text'=>'1','correct'=>false],['text'=>'7','correct'=>false]]],
                ['text'=>'A^{−1} = (1/5)[[3,−1],[−1,2]] for above. X = A^{−1}[[5],[10]] = ?','difficulty'=>'medium','tag'=>'Inverse Method','explanation'=>'(1/5)[[3,−1],[−1,2]][[5],[10]] = (1/5)[[15−10],[−5+20]] = (1/5)[[5],[15]] = [[1],[3]].','options'=>[['text'=>'x=1, y=3','correct'=>true],['text'=>'x=3, y=1','correct'=>false],['text'=>'x=5, y=10','correct'=>false],['text'=>'x=1/5, y=3/5','correct'=>false]]],
                ['text'=>'The inverse method is most efficient when:','difficulty'=>'medium','tag'=>'Inverse Method','explanation'=>'Computing A^{−1} once is expensive but pays off when solving AX=B_1, AX=B_2, ... with the same A.','options'=>[['text'=>'The same A is used with multiple different B vectors','correct'=>true],['text'=>'The system is solved only once','correct'=>false],['text'=>'A is a large sparse matrix','correct'=>false],['text'=>'B is a vector of all ones','correct'=>false]]],
                ['text'=>'For A = [[1,0],[0,2]], A^{−1} = ?','difficulty'=>'easy','tag'=>'Diagonal Inverse','explanation'=>'For a diagonal matrix, the inverse has reciprocals on the diagonal: [[1,0],[0,1/2]].','options'=>[['text'=>'[[1,0],[0,1/2]]','correct'=>true],['text'=>'[[0,1],[2,0]]','correct'=>false],['text'=>'[[2,0],[0,1]]','correct'=>false],['text'=>'[[−1,0],[0,−2]]','correct'=>false]]],
                ['text'=>'The inverse method for AX=B requires X = ?','difficulty'=>'easy','tag'=>'Inverse Method','explanation'=>'Multiplying AX=B on the left by A^{−1}: A^{−1}AX = A^{−1}B → IX = A^{−1}B → X = A^{−1}B.','options'=>[['text'=>'A^{−1}B','correct'=>true],['text'=>'BA^{−1}','correct'=>false],['text'=>'A^{−1}+B','correct'=>false],['text'=>'B/det(A)','correct'=>false]]],
                ['text'=>'For AX=B with the 2×2 inverse formula, X = (1/(ad−bc))×[[d,−b],[−c,a]]×B. This applies when:','difficulty'=>'medium','tag'=>'Inverse Method','explanation'=>'The formula applies when ad−bc ≠ 0, i.e., when A is invertible.','options'=>[['text'=>'ad − bc ≠ 0','correct'=>true],['text'=>'ad − bc = 0','correct'=>false],['text'=>'A is symmetric','correct'=>false],['text'=>'B is a zero vector','correct'=>false]]],
                ['text'=>'If A is 3×3 and invertible, the inverse method gives a unique X for:','difficulty'=>'easy','tag'=>'Inverse Method','explanation'=>'X = A^{−1}B gives a unique solution for any right-hand side B.','options'=>[['text'=>'Any right-hand side B','correct'=>true],['text'=>'Only B = 0','correct'=>false],['text'=>'Only B with positive entries','correct'=>false],['text'=>'B with the same size as A^{−1}','correct'=>false]]],
                ['text'=>'Solve [[3,1],[5,2]]X = [[7],[11]] given A^{−1} = [[2,−1],[−5,3]].','difficulty'=>'hard','tag'=>'Inverse Method','explanation'=>'X = [[2,−1],[−5,3]][[7],[11]] = [[14−11],[−35+33]] = [[3],[−2]].','options'=>[['text'=>'x=3, y=−2','correct'=>true],['text'=>'x=−2, y=3','correct'=>false],['text'=>'x=7, y=11','correct'=>false],['text'=>'x=1, y=1','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz7(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 7',
            'description' => 'Consistency and uniqueness (rank conditions)',
            'questions'   => [
                ['text'=>'A system AX = B is consistent if:','difficulty'=>'easy','tag'=>'Consistency','explanation'=>'A system is consistent if it has at least one solution (unique or infinitely many).','options'=>[['text'=>'It has at least one solution','correct'=>true],['text'=>'It has exactly one solution','correct'=>false],['text'=>'det(A) ≠ 0','correct'=>false],['text'=>'A is invertible','correct'=>false]]],
                ['text'=>'The rank of a matrix equals:','difficulty'=>'easy','tag'=>'Rank','explanation'=>'Rank = number of non-zero rows in row echelon form = number of pivot positions.','options'=>[['text'=>'Number of non-zero rows in REF','correct'=>true],['text'=>'Number of rows','correct'=>false],['text'=>'The determinant','correct'=>false],['text'=>'Sum of diagonal entries','correct'=>false]]],
                ['text'=>'A system AX = B has a unique solution iff:','difficulty'=>'medium','tag'=>'Uniqueness','explanation'=>'Unique solution exists when rank(A) = rank([A|B]) = n (number of unknowns).','options'=>[['text'=>'rank(A) = rank([A|B]) = n','correct'=>true],['text'=>'rank(A) < n','correct'=>false],['text'=>'rank(A) > rank([A|B])','correct'=>false],['text'=>'rank([A|B]) > n','correct'=>false]]],
                ['text'=>'A system has NO solution when:','difficulty'=>'medium','tag'=>'Inconsistency','explanation'=>'The system is inconsistent when rank(A) < rank([A|B]) — a pivot appears in the augmented column.','options'=>[['text'=>'rank(A) < rank([A|B])','correct'=>true],['text'=>'rank(A) = rank([A|B])','correct'=>false],['text'=>'rank(A) > n','correct'=>false],['text'=>'det(A) ≠ 0','correct'=>false]]],
                ['text'=>'A system has infinitely many solutions when:','difficulty'=>'medium','tag'=>'Infinite Solutions','explanation'=>'Infinitely many solutions occur when the system is consistent but underdetermined: rank(A) = rank([A|B]) < n.','options'=>[['text'=>'rank(A) = rank([A|B]) < n','correct'=>true],['text'=>'rank(A) = n','correct'=>false],['text'=>'rank(A) > rank([A|B])','correct'=>false],['text'=>'det(A) = 1','correct'=>false]]],
                ['text'=>'The Rouché-Capelli theorem: AX = B is consistent if:','difficulty'=>'medium','tag'=>'Rouché-Capelli','explanation'=>'Rouché-Capelli: AX=B is consistent iff rank(A) = rank([A|B]).','options'=>[['text'=>'rank(A) = rank([A|B])','correct'=>true],['text'=>'rank(A) = n','correct'=>false],['text'=>'det(A) = 0','correct'=>false],['text'=>'All RHS values are zero','correct'=>false]]],
                ['text'=>'For [[1,2,3,4],[2,4,6,8],[3,6,9,12]], rank([A|B]) = ?','difficulty'=>'medium','tag'=>'Rank','explanation'=>'All rows are multiples of [1,2,3,4], so rank = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'3','correct'=>false],['text'=>'2','correct'=>false],['text'=>'4','correct'=>false]]],
                ['text'=>'For [[1,2,3,4],[2,4,6,8],[3,6,9,12]], how many solutions?','difficulty'=>'medium','tag'=>'Infinite Solutions','explanation'=>'rank=1 = rank([A|B]) < n=3, so infinitely many solutions.','options'=>[['text'=>'Infinitely many','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'Exactly one','correct'=>false],['text'=>'Two','correct'=>false]]],
                ['text'=>'For [[1,2,3,4],[0,0,0,5]], the system is:','difficulty'=>'easy','tag'=>'Inconsistency','explanation'=>'Row 2 says 0=5, which is impossible. The system is inconsistent.','options'=>[['text'=>'Inconsistent (no solution)','correct'=>true],['text'=>'Consistent with unique solution','correct'=>false],['text'=>'Consistent with infinitely many solutions','correct'=>false],['text'=>'Underdetermined only','correct'=>false]]],
                ['text'=>'A homogeneous system AX = 0 always has:','difficulty'=>'easy','tag'=>'Homogeneous System','explanation'=>'X=0 (the trivial solution) always satisfies AX=0, so homogeneous systems are always consistent.','options'=>[['text'=>'At least the trivial solution X = 0','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'Only non-trivial solutions','correct'=>false],['text'=>'Exactly one non-trivial solution','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz8(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 8',
            'description' => 'Homogeneous systems and null space',
            'questions'   => [
                ['text'=>'AX = 0 is called a homogeneous system. The trivial solution is:','difficulty'=>'easy','tag'=>'Homogeneous System','explanation'=>'The trivial solution is X = 0, i.e., all variables equal zero. It always exists.','options'=>[['text'=>'X = 0 (all variables are zero)','correct'=>true],['text'=>'X = 1 for all variables','correct'=>false],['text'=>'X = A^{−1}','correct'=>false],['text'=>'No solution exists','correct'=>false]]],
                ['text'=>'AX = 0 has a non-trivial solution iff:','difficulty'=>'medium','tag'=>'Homogeneous System','explanation'=>'A non-trivial (non-zero) solution exists iff det(A)=0, meaning A is singular.','options'=>[['text'=>'det(A) = 0','correct'=>true],['text'=>'det(A) = 1','correct'=>false],['text'=>'A is invertible','correct'=>false],['text'=>'rank(A) = n','correct'=>false]]],
                ['text'=>'For a homogeneous system with n unknowns and rank(A) = r, the number of free variables is:','difficulty'=>'medium','tag'=>'Free Variables','explanation'=>'By the rank-nullity theorem, free variables (nullity) = n − r.','options'=>[['text'=>'n − r','correct'=>true],['text'=>'r','correct'=>false],['text'=>'n','correct'=>false],['text'=>'n × r','correct'=>false]]],
                ['text'=>'The set of all solutions to AX = 0 forms:','difficulty'=>'medium','tag'=>'Null Space','explanation'=>'The solution set of AX=0 is a vector space called the null space (or kernel) of A.','options'=>[['text'=>'A vector space (null space/kernel)','correct'=>true],['text'=>'A single vector','correct'=>false],['text'=>'A finite set of vectors','correct'=>false],['text'=>'A non-empty bounded set','correct'=>false]]],
                ['text'=>'If AX = B has particular solution X_p, the general solution is:','difficulty'=>'medium','tag'=>'General Solution','explanation'=>'General solution = particular solution + any homogeneous solution: X = X_p + X_h where AX_h = 0.','options'=>[['text'=>'X = X_p + X_h, where X_h solves AX = 0','correct'=>true],['text'=>'X = X_p only','correct'=>false],['text'=>'X = A^{−1}X_p','correct'=>false],['text'=>'X = X_p − X_h','correct'=>false]]],
                ['text'=>'A homogeneous system with fewer equations than unknowns always has:','difficulty'=>'medium','tag'=>'Underdetermined Homogeneous','explanation'=>'When m < n (fewer equations than unknowns), rank ≤ m < n, so at least one free variable exists — infinitely many solutions.','options'=>[['text'=>'Infinitely many solutions','correct'=>true],['text'=>'Only the trivial solution','correct'=>false],['text'=>'No solution','correct'=>false],['text'=>'A unique non-trivial solution','correct'=>false]]],
                ['text'=>'If AX = 0 has only the trivial solution, then AX = B has:','difficulty'=>'medium','tag'=>'Homogeneous System','explanation'=>'Trivial solution only ↔ A is invertible ↔ AX=B has a unique solution for any B.','options'=>[['text'=>'Exactly one solution for any B','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'Infinitely many solutions','correct'=>false],['text'=>'Zero solutions','correct'=>false]]],
                ['text'=>'The null space of A = [[1,2],[2,4]] contains:','difficulty'=>'hard','tag'=>'Null Space','explanation'=>'From x+2y=0: x=−2y. General solution: [−2,1]^T × t for any scalar t.','options'=>[['text'=>'All scalar multiples of [−2,1]^T','correct'=>true],['text'=>'Only the zero vector','correct'=>false],['text'=>'All 2D vectors','correct'=>false],['text'=>'Only [1,2]^T','correct'=>false]]],
                ['text'=>'The nullity of A = [[1,2,3],[4,5,6],[7,8,9]] is:','difficulty'=>'hard','tag'=>'Null Space','explanation'=>'rank(A)=2 (rows are linearly dependent). Nullity = n−rank = 3−2 = 1.','options'=>[['text'=>'1','correct'=>true],['text'=>'0','correct'=>false],['text'=>'2','correct'=>false],['text'=>'3','correct'=>false]]],
                ['text'=>'The general solution to AX=B when det(A)=0 and a particular X_p exists is:','difficulty'=>'hard','tag'=>'General Solution','explanation'=>'X = X_p + t·v where v is a null space vector and t is any scalar (free parameter).','options'=>[['text'=>'X = X_p + t·v (particular + free parameter × null vector)','correct'=>true],['text'=>'X = A^{−1}B','correct'=>false],['text'=>'X = B','correct'=>false],['text'=>'No general form exists','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz9(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 9',
            'description' => 'Mixed system problems',
            'questions'   => [
                ['text'=>'Solve by inspection: x=3, 2y=4, 3z=9. What is x+y+z?','difficulty'=>'easy','tag'=>'Simple Systems','explanation'=>'x=3, y=2, z=3. Sum = 3+2+3 = 8.','options'=>[['text'=>'8','correct'=>true],['text'=>'6','correct'=>false],['text'=>'9','correct'=>false],['text'=>'3','correct'=>false]]],
                ['text'=>'The system x+y+z=6, x+y+z=6, x+y+z=6 has:','difficulty'=>'easy','tag'=>'Solution Types','explanation'=>'All three equations are identical — one equation with three unknowns — giving infinitely many solutions.','options'=>[['text'=>'Infinitely many solutions','correct'=>true],['text'=>'Exactly one solution','correct'=>false],['text'=>'No solution','correct'=>false],['text'=>'Exactly three solutions','correct'=>false]]],
                ['text'=>'RREF [[1,0,0,2],[0,1,0,−1],[0,0,1,4]] gives solution:','difficulty'=>'easy','tag'=>'RREF Solution','explanation'=>'Read directly from RREF: x=2, y=−1, z=4.','options'=>[['text'=>'x=2, y=−1, z=4','correct'=>true],['text'=>'x=1, y=1, z=1','correct'=>false],['text'=>'x=−2, y=1, z=−4','correct'=>false],['text'=>'x=0, y=0, z=0','correct'=>false]]],
                ['text'=>'For 2x−y=3 and 4x−2y=6, this system has:','difficulty'=>'easy','tag'=>'Solution Types','explanation'=>'The second equation is exactly 2× the first. They are dependent, giving infinitely many solutions.','options'=>[['text'=>'Infinitely many solutions','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'Unique solution x=1.5, y=0','correct'=>false],['text'=>'Unique solution x=0, y=−3','correct'=>false]]],
                ['text'=>'For x−y=1 and −x+y=3, this system has:','difficulty'=>'easy','tag'=>'Inconsistency','explanation'=>'Adding the equations: 0=4, a contradiction. The system is inconsistent (no solution).','options'=>[['text'=>'No solution','correct'=>true],['text'=>'Infinitely many solutions','correct'=>false],['text'=>'x=2, y=1','correct'=>false],['text'=>'x=−1, y=−2','correct'=>false]]],
                ['text'=>'The point (1,2,3) satisfies x+y−z=0 because:','difficulty'=>'easy','tag'=>'Verification','explanation'=>'1+2−3 = 0 ✓. The point lies on the plane x+y−z=0.','options'=>[['text'=>'1+2−3 = 0','correct'=>true],['text'=>'1+2+3 = 6','correct'=>false],['text'=>'All three components are positive','correct'=>false],['text'=>'The point lies on the y-axis','correct'=>false]]],
                ['text'=>'Reading the system from [[1,0,3],[0,1,−2]] (RREF):','difficulty'=>'easy','tag'=>'RREF Solution','explanation'=>'Row 1: x=3, Row 2: y=−2.','options'=>[['text'=>'x=3, y=−2','correct'=>true],['text'=>'x=−2, y=3','correct'=>false],['text'=>'x=0, y=0','correct'=>false],['text'=>'x=1, y=1','correct'=>false]]],
                ['text'=>'Simplifying 3x+6y=12 and 2x−4y=8:','difficulty'=>'easy','tag'=>'System Simplification','explanation'=>'Divide first by 3: x+2y=4. Divide second by 2: x−2y=4. Unique solution: x=4, y=0.','options'=>[['text'=>'x+2y=4, x−2y=4 (unique solution x=4, y=0)','correct'=>true],['text'=>'x+2y=4, x+2y=4 (infinite solutions)','correct'=>false],['text'=>'3x+6y=12 (unsimplified)','correct'=>false],['text'=>'x=4, y=1','correct'=>false]]],
                ['text'=>'How many solutions does x+2y−z=3 (one equation, three unknowns) have?','difficulty'=>'easy','tag'=>'Free Variables','explanation'=>'One equation with three unknowns has 2 free variables → infinitely many solutions.','options'=>[['text'=>'Infinitely many','correct'=>true],['text'=>'No solution','correct'=>false],['text'=>'One solution','correct'=>false],['text'=>'Three solutions','correct'=>false]]],
                ['text'=>'If Ax=b₁ has solution x₁ and Ax=b₂ has solution x₂, Ax=b₁+b₂ has solution:','difficulty'=>'medium','tag'=>'Linearity','explanation'=>'By linearity: A(x₁+x₂) = Ax₁+Ax₂ = b₁+b₂. So x₁+x₂ is the solution.','options'=>[['text'=>'x₁+x₂','correct'=>true],['text'=>'x₁×x₂','correct'=>false],['text'=>'(b₁+b₂)/2','correct'=>false],['text'=>'No solution in general','correct'=>false]]],
            ],
        ];
    }

    private function systemsQuiz10(): array
    {
        return [
            'title'       => 'Systems of Linear Equations — Practice Set 10',
            'description' => 'Advanced: overdetermined, geometric interpretation, parametric solutions',
            'questions'   => [
                ['text'=>'A system Ax=b where A is m×n with m>n is called:','difficulty'=>'medium','tag'=>'System Types','explanation'=>'When there are more equations than unknowns (m>n), the system is overdetermined.','options'=>[['text'=>'Overdetermined','correct'=>true],['text'=>'Underdetermined','correct'=>false],['text'=>'Square','correct'=>false],['text'=>'Homogeneous','correct'=>false]]],
                ['text'=>'The least-squares solution minimizes:','difficulty'=>'hard','tag'=>'Least Squares','explanation'=>'The least-squares solution minimizes the Euclidean norm of the residual ||Ax−b||².','options'=>[['text'=>'||Ax − b||²','correct'=>true],['text'=>'det(A)','correct'=>false],['text'=>'rank(A)','correct'=>false],['text'=>'||x||','correct'=>false]]],
                ['text'=>'For n=4 unknowns and rank(A)=2, the dimension of the solution space of AX=0 is:','difficulty'=>'medium','tag'=>'Null Space','explanation'=>'By rank-nullity: nullity = n − rank = 4 − 2 = 2.','options'=>[['text'=>'2','correct'=>true],['text'=>'4','correct'=>false],['text'=>'1','correct'=>false],['text'=>'6','correct'=>false]]],
                ['text'=>'The normal equations for least squares are:','difficulty'=>'hard','tag'=>'Least Squares','explanation'=>'Minimizing ||Ax−b||² leads to the normal equations A^T Ax = A^T b.','options'=>[['text'=>'A^T Ax = A^T b','correct'=>true],['text'=>'Ax = b','correct'=>false],['text'=>'AAx = b','correct'=>false],['text'=>'A^T x = b','correct'=>false]]],
                ['text'=>'If A is 3×3 with rank(A)=3, then AX=b has:','difficulty'=>'easy','tag'=>'Uniqueness','explanation'=>'Full rank (rank=n) means A is invertible, so AX=b has exactly one solution for any b.','options'=>[['text'=>'Exactly one solution','correct'=>true],['text'=>'Infinitely many solutions','correct'=>false],['text'=>'No solution','correct'=>false],['text'=>'Two solutions','correct'=>false]]],
                ['text'=>'A system of linear equations in 3D represents geometrically the intersection of:','difficulty'=>'medium','tag'=>'Geometric Interpretation','explanation'=>'Each equation in 3D variables defines a plane; solving the system finds their intersection.','options'=>[['text'=>'Planes','correct'=>true],['text'=>'Lines only','correct'=>false],['text'=>'Spheres','correct'=>false],['text'=>'Points','correct'=>false]]],
                ['text'=>'A unique solution to a 3×3 system is geometrically:','difficulty'=>'easy','tag'=>'Geometric Interpretation','explanation'=>'Three planes in general position intersect at exactly one point.','options'=>[['text'=>'A single point','correct'=>true],['text'=>'A line','correct'=>false],['text'=>'A plane','correct'=>false],['text'=>'A sphere','correct'=>false]]],
                ['text'=>'For x+y+z=0, x−y+z=0, the solutions form:','difficulty'=>'hard','tag'=>'Null Space','explanation'=>'Two equations with rank 2, 3 unknowns: nullity=1. The solution set is a line through the origin.','options'=>[['text'=>'A line through the origin','correct'=>true],['text'=>'The origin only','correct'=>false],['text'=>'A plane','correct'=>false],['text'=>'All of R³','correct'=>false]]],
                ['text'=>'The parametric solution x=1+2t, y=−t, z=3+t for t∈R represents:','difficulty'=>'medium','tag'=>'Parametric Solution','explanation'=>'A single-parameter family of solutions traces a line in 3D space.','options'=>[['text'=>'A line in 3D','correct'=>true],['text'=>'A plane','correct'=>false],['text'=>'A point','correct'=>false],['text'=>'A circle','correct'=>false]]],
                ['text'=>'For Ax=b₁ with solution x₁ and Ax=b₂ with solution x₂, what solves Ax=3b₁−b₂?','difficulty'=>'hard','tag'=>'Linearity','explanation'=>'By linearity: A(3x₁−x₂) = 3Ax₁−Ax₂ = 3b₁−b₂. So x=3x₁−x₂.','options'=>[['text'=>'3x₁ − x₂','correct'=>true],['text'=>'x₁ + x₂','correct'=>false],['text'=>'x₁ − 3x₂','correct'=>false],['text'=>'No solution in general','correct'=>false]]],
            ],
        ];
    }

    // ── Material data ─────────────────────────────────────────────────────────

    private function matricesMaterials(): array
    {
        return [
            [
                'title'            => 'Introduction to Matrices',
                'description'      => 'A beginner-friendly introduction to what matrices are, their notation, and basic types.',
                'content_type'     => 'article',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-introduction.html',
                'duration_minutes' => 15,
                'tags'             => 'matrices, introduction, basics',
                'keywords'         => 'matrix, rows, columns, elements',
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Matrix Operations — Khan Academy',
                'description'      => 'Video lessons covering matrix addition, subtraction, and scalar multiplication.',
                'content_type'     => 'video',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices',
                'duration_minutes' => 30,
                'tags'             => 'addition, scalar, operations',
                'keywords'         => 'matrix addition, scalar multiplication',
                'is_remedial'      => true,
            ],
            [
                'title'            => 'Matrix Multiplication Step-by-Step',
                'description'      => 'Worked examples and practice problems on multiplying matrices of various sizes.',
                'content_type'     => 'example',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-multiplying.html',
                'duration_minutes' => 20,
                'tags'             => 'multiplication, worked examples',
                'keywords'         => 'matrix multiplication, dot product, dimensions',
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Transpose and Special Matrices Practice',
                'description'      => 'Practice exercises on transpose, symmetric, identity, and triangular matrices.',
                'content_type'     => 'exercise',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices/alg-properties-of-matrix-addition-and-scalar-multiplication/e/matrix-transpose',
                'duration_minutes' => 25,
                'tags'             => 'transpose, symmetric, identity, practice',
                'keywords'         => 'transpose, symmetric, identity matrix',
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Matrices Summary Sheet',
                'description'      => 'Quick reference card covering all key matrix types, operations, and properties.',
                'content_type'     => 'summary',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-types.html',
                'duration_minutes' => 5,
                'tags'             => 'summary, cheat sheet, reference',
                'keywords'         => 'matrix summary, key facts, properties',
                'is_remedial'      => true,
            ],
        ];
    }

    private function determinantsMaterials(): array
    {
        return [
            [
                'title'            => 'Understanding Determinants',
                'description'      => 'A clear explanation of what determinants represent geometrically and algebraically.',
                'content_type'     => 'article',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-determinant.html',
                'duration_minutes' => 15,
                'tags'             => 'determinant, introduction, geometry',
                'keywords'         => 'determinant, area, volume, singular',
                'is_remedial'      => false,
            ],
            [
                'title'            => '2×2 and 3×3 Determinants — Khan Academy',
                'description'      => 'Video tutorial on computing determinants using cofactor expansion.',
                'content_type'     => 'video',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices/alg-determinants-and-inverses-of-matrices/v/finding-the-determinant-of-a-2x2-matrix',
                'duration_minutes' => 25,
                'tags'             => '2x2, 3x3, cofactor expansion, video',
                'keywords'         => 'determinant, cofactor, expansion',
                'is_remedial'      => true,
            ],
            [
                'title'            => 'Properties of Determinants — Worked Examples',
                'description'      => 'Examples demonstrating row swap, scalar multiple, and multiplicative properties.',
                'content_type'     => 'example',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-determinant.html',
                'duration_minutes' => 20,
                'tags'             => 'properties, row operations, examples',
                'keywords'         => 'row swap, scalar, multiplicative property',
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Determinants Practice Problems',
                'description'      => 'Drill problems: evaluate determinants for various 2×2 and 3×3 matrices.',
                'content_type'     => 'exercise',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices/alg-determinants-and-inverses-of-matrices/e/matrix_determinants_1',
                'duration_minutes' => 30,
                'tags'             => 'practice, drill, 2x2, 3x3',
                'keywords'         => 'determinant practice, cofactor, triangular',
                'is_remedial'      => true,
            ],
            [
                'title'            => 'Determinants Quick Reference',
                'description'      => 'Summary of all determinant properties, formulas, and common pitfalls.',
                'content_type'     => 'summary',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/matrix-determinant.html',
                'duration_minutes' => 5,
                'tags'             => 'summary, reference, formulas',
                'keywords'         => 'determinant formulas, properties, quick reference',
                'is_remedial'      => true,
            ],
        ];
    }

    private function systemsMaterials(): array
    {
        return [
            [
                'title'            => 'Introduction to Systems of Linear Equations',
                'description'      => 'What a system of linear equations is, how to identify consistent/inconsistent systems, and geometric interpretation.',
                'content_type'     => 'article',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/systems-linear-equations.html',
                'duration_minutes' => 15,
                'tags'             => 'systems, introduction, consistent, inconsistent',
                'keywords'         => 'linear system, consistent, unique solution',
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Gaussian Elimination — Step by Step',
                'description'      => 'Video walkthrough of the Gaussian elimination method with back-substitution.',
                'content_type'     => 'video',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices/alg-row-echelon-and-gaussian-elimination/v/matrices-reduced-row-echelon-form-1',
                'duration_minutes' => 35,
                'tags'             => 'gaussian elimination, row echelon, video',
                'keywords'         => 'gaussian elimination, augmented matrix, row echelon',
                'is_remedial'      => true,
            ],
            [
                'title'            => "Cramer's Rule — Worked Examples",
                'description'      => "Step-by-step worked examples applying Cramer's Rule to 2×2 and 3×3 systems.",
                'content_type'     => 'example',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.mathsisfun.com/algebra/cramers-rule.html',
                'duration_minutes' => 20,
                'tags'             => "cramer's rule, examples, determinant",
                'keywords'         => "cramer's rule, determinant, substitution",
                'is_remedial'      => false,
            ],
            [
                'title'            => 'Solving Systems — Practice Set',
                'description'      => 'Mixed practice problems: solve 2-variable and 3-variable systems using elimination and substitution.',
                'content_type'     => 'exercise',
                'difficulty_level' => 'intermediate',
                'external_url'     => 'https://www.khanacademy.org/math/algebra-home/alg-matrices/alg-row-echelon-and-gaussian-elimination/e/matrix_row_operations',
                'duration_minutes' => 40,
                'tags'             => 'practice, elimination, substitution, 3-variable',
                'keywords'         => 'linear system, elimination, substitution, practice',
                'is_remedial'      => true,
            ],
            [
                'title'            => 'Systems of Linear Equations — Summary',
                'description'      => 'Concise review of all methods: substitution, elimination, Gaussian, and matrix inverse.',
                'content_type'     => 'summary',
                'difficulty_level' => 'basic',
                'external_url'     => 'https://www.mathsisfun.com/algebra/systems-linear-equations.html',
                'duration_minutes' => 5,
                'tags'             => 'summary, methods, reference',
                'keywords'         => 'linear equations summary, methods overview',
                'is_remedial'      => true,
            ],
        ];
    }
}
