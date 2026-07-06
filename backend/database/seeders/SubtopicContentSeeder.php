<?php

namespace Database\Seeders;

use App\Models\Topic;
use Illuminate\Database\Seeder;

class SubtopicContentSeeder extends Seeder
{
    public function run(): void
    {
        $matrices     = Topic::where('topic_name', 'Matrices')->whereNull('parent_topic_id')->first();
        $determinants = Topic::where('topic_name', 'Determinants')->whereNull('parent_topic_id')->first();
        $systems      = Topic::where('topic_name', 'Systems of Linear Equations')->whereNull('parent_topic_id')->first();

        if (!$matrices || !$determinants || !$systems) {
            $this->command->warn('Parent topics not found. Run AlmsarsaSeeder first.');
            return;
        }

        $this->seed($matrices, $this->ch1Subtopics());
        $this->seed($systems, $this->ch2Subtopics());
        $this->seed($determinants, $this->ch3Subtopics());
    }

    private function seed(Topic $parent, array $subtopics): void
    {
        foreach ($subtopics as $data) {
            Topic::firstOrCreate(
                ['topic_name' => $data['name'], 'parent_topic_id' => $parent->topic_id],
                [
                    'course_id'        => $parent->course_id,
                    'parent_topic_id'  => $parent->topic_id,
                    'topic_name'       => $data['name'],
                    'description'      => $data['desc'],
                    'syllabus'         => $data['syllabus'],
                    'sequence_order'   => $data['order'],
                    'difficulty_level' => $parent->difficulty_level,
                    'is_active'        => true,
                ]
            );
        }
    }

    // ── Chapter 1: Matrices ───────────────────────────────────────────────────

    private function ch1Subtopics(): array
    {
        return [
            [
                'name'  => '1.1 Introduction to Matrices',
                'desc'  => 'Definition, size, equal matrices, and transpose',
                'order' => 1,
                'syllabus' => <<<'END'
[def:Matrix]
If m and n are positive integers, an m × n matrix is a rectangular array of m rows and n columns. Every matrix is denoted by a capital letter (A, B, C). The element in row i and column j is written aᵢⱼ.

General m × n matrix A:
[matrix]a₁₁,a₁₂,…,a₁ₙ;a₂₁,a₂₂,…,a₂ₙ;⋮,⋮,⋱,⋮;aₘ₁,aₘ₂,…,aₘₙ[/matrix]
[/def]

[example:Examples of Matrices]
2×2 square matrix:
[matrix]2,-1;0,π[/matrix]

2×3 matrix:
[matrix]0,2,⅓;-4,1,-1[/matrix]

1×5 row matrix:
[matrix]5,0,0,-6,√3[/matrix]

2×1 column matrix:
[matrix]0;7[/matrix]

1×1 matrix:
[matrix]-3[/matrix]
[/example]

[def:Size and Square Matrix]
The size of a matrix is written as m × n (rows first, then columns). If m = n, it is a square matrix of order n. The elements a₁₁, a₂₂, …, aₙₙ form the main diagonal.
[/def]

[def:Equal Matrices]
Matrices A and B are equal (A = B) if and only if they have the same size and every corresponding element is identical: aᵢⱼ = bᵢⱼ for all i, j.
[/def]

[def:Transpose]
The transpose of an m × n matrix A (written Aᵀ) is the n × m matrix formed by interchanging rows and columns. The element at (i, j) in A moves to position (j, i) in Aᵀ.
[/def]

[example:Finding the Transpose: Step by Step]
Given A:
[matrix]1,-5,2;3,2,4;-1,0,7[/matrix]

To transpose: rows become columns.
Row 1 [1, −5, 2] → Col 1 of Aᵀ
Row 2 [3,  2, 4] → Col 2 of Aᵀ
Row 3 [−1, 0, 7] → Col 3 of Aᵀ

Aᵀ:
[matrix]1,3,-1;-5,2,0;2,4,7[/matrix]

Note: A was 3×3 so Aᵀ is also 3×3. For a 2×3 matrix B:
[matrix]-1,4,2;3,-1,5[/matrix]

Its transpose Bᵀ (3×2) is:
[matrix]-1,3;4,-1;2,5[/matrix]
[/example]
END,
            ],
            [
                'name'  => '1.2 Types of Matrices',
                'desc'  => 'Triangular, diagonal, identity, zero, row/column, and symmetric matrices',
                'order' => 2,
                'syllabus' => <<<'END'
All triangular and diagonal matrices must be square matrices.

[def:Triangular Matrix]
Lower triangular: all elements above the main diagonal are zero (aᵢⱼ = 0 for i < j).
Upper triangular: all elements below the main diagonal are zero (aᵢⱼ = 0 for i > j).

Lower triangular form:
[matrix]a₁₁,0,0;a₂₁,a₂₂,0;a₃₁,a₃₂,a₃₃[/matrix]

Upper triangular form:
[matrix]a₁₁,a₁₂,a₁₃;0,a₂₂,a₂₃;0,0,a₃₃[/matrix]
[/def]

[example:Identifying Matrix Types]
Upper triangular ✓:
[matrix]1,2;0,3[/matrix]

Upper triangular ✓:
[matrix]1,0,-1;2,4,0;1,3,5[/matrix]

Lower triangular ✓:
[matrix]0,0,0;1,0,0;2,8,2[/matrix]

Neither ✗ (non-zero entries both above and below diagonal):
[matrix]1,2,0;3,0,4;0,5,6[/matrix]
[/example]

[def:Diagonal Matrix]
A square matrix where all elements outside the main diagonal are zero (aᵢⱼ = 0 for i ≠ j). A diagonal matrix is both upper and lower triangular.
[matrix]d₁,0,0;0,d₂,0;0,0,d₃[/matrix]
[/def]

[def:Identity Matrix]
Iₙ is a square matrix with 1s on the main diagonal and 0s elsewhere. It satisfies AI = IA = A for any compatible matrix A.

I₂:
[matrix]1,0;0,1[/matrix]

I₃:
[matrix]1,0,0;0,1,0;0,0,1[/matrix]
[/def]

[def:Zero Matrix]
O or Oₘₓₙ: every element is zero. Can be any size.
[matrix]0,0;0,0[/matrix]
[/def]

[def:Row and Column Matrices]
Column matrix (m × 1) — only one column:
[matrix]3;8;-2[/matrix]

Row matrix (1 × n) — only one row:
[matrix]1,5,-9,4[/matrix]
[/def]

[def:Symmetric Matrix]
A square matrix where Aᵀ = A, meaning aᵢⱼ = aⱼᵢ for all i, j. The matrix is a mirror image of itself across the main diagonal.
[matrix]-1,3;3,4[/matrix]
[matrix]0,2,5;2,-2,3;5,3,7[/matrix]
[/def]
END,
            ],
            [
                'name'  => '1.3 Matrix Operations',
                'desc'  => 'Addition, scalar multiplication, and matrix multiplication',
                'order' => 3,
                'syllabus' => <<<'END'
[def:Matrix Addition]
Two matrices can be added only if they have the same size. Add corresponding elements:
[rule](A + B)ᵢⱼ = aᵢⱼ + bᵢⱼ[/rule]
[/def]

[example:Matrix Addition: Step by Step]
A:
[matrix]-1,2,3;0,-4,7[/matrix]

B:
[matrix]1,0,-4;4,-3,-1[/matrix]

Add corresponding elements position by position:
Row 1, Col 1: −1 + 1 = 0
Row 1, Col 2:  2 + 0 = 2
Row 1, Col 3:  3 + (−4) = −1
Row 2, Col 1:  0 + 4 = 4
Row 2, Col 2: −4 + (−3) = −7
Row 2, Col 3:  7 + (−1) = 6

A + B:
[matrix]0,2,-1;4,-7,6[/matrix]

[note]Matrices of different sizes cannot be added. E.g. a 2×3 plus a 2×2 is undefined.[/note]
[/example]

[def:Scalar Multiplication]
Multiplying matrix A by scalar c multiplies every element by c:
[rule]cA = (c · aᵢⱼ)[/rule]
Subtraction: A − B = A + (−1)B
[/def]

[example:Scalar Multiplication: Step by Step]
Given A:
[matrix]-1,2,3;0,-4,7[/matrix]

Find −A (multiply every element by −1):
[matrix]1,-2,-3;0,4,-7[/matrix]

Find 2A (multiply every element by 2):
[matrix]-2,4,6;0,-8,14[/matrix]
[/example]

[def:Matrix Multiplication]
Let A be m × n and B be n × p. The product AB is m × p, where each entry is the dot product of a row of A with a column of B:
[rule]cᵢⱼ = aᵢ₁b₁ⱼ + aᵢ₂b₂ⱼ + … + aᵢₙbₙⱼ[/rule]
The number of columns in A must equal the number of rows in B.
[/def]

[example:Matrix Multiplication: 2×2 × 2×2]
A:
[matrix]1,0;2,-1[/matrix]

B:
[matrix]6,1;-2,4[/matrix]

c₁₁ = (1)(6)+(0)(−2) = 6
c₁₂ = (1)(1)+(0)(4)  = 1
c₂₁ = (2)(6)+(−1)(−2) = 14
c₂₂ = (2)(1)+(−1)(4)  = −2

AB:
[matrix]6,1;14,-2[/matrix]
[/example]

[example:Matrix Multiplication: 2×3 × 3×2]
A (2×3):
[matrix]1,2,0;3,-1,4[/matrix]

B (3×2):
[matrix]2,1;0,3;-1,2[/matrix]

c₁₁ = (1)(2)+(2)(0)+(0)(−1) = 2
c₁₂ = (1)(1)+(2)(3)+(0)(2)  = 7
c₂₁ = (3)(2)+(−1)(0)+(4)(−1) = 2
c₂₂ = (3)(1)+(−1)(3)+(4)(2)  = 8

AB:
[matrix]2,7;2,8[/matrix]

[note]Matrix multiplication is NOT commutative: AB ≠ BA in general.[/note]
[/example]

[example:Size Check Before Multiplying]
Check compatibility: columns of A must equal rows of B.

A (2×3) × B (3×4) → AB (2×4) ✓ inner dimensions match (3 = 3)
A (3×2) × B (3×2) → undefined ✗ inner dimensions 2 ≠ 3
A (1×n) × B (n×1) → AB (1×1) ✓ scalar result
A (n×1) × B (1×n) → AB (n×n) ✓ outer product
[/example]
END,
            ],
            [
                'name'  => '1.4 Properties and Theorems',
                'desc'  => 'Properties of operations, zero, identity, and transpose',
                'order' => 4,
                'syllabus' => <<<'END'
[theorem:Properties of Matrix Addition and Scalar Multiplication]
For m × n matrices A, B, C and scalars k, l:
1. A + B = B + A (Commutative)
2. A + (B + C) = (A + B) + C (Associative)
3. (kl)A = k(lA)
4. 1A = A
5. k(A + B) = kA + kB (Distributive)
6. (k + l)A = kA + lA (Distributive)
[/theorem]

[theorem:Properties of Matrix Multiplication]
Where sizes are compatible and k is a scalar:
1. A(BC) = (AB)C (Associative)
2. A(B + C) = AB + AC (Left Distributive)
3. (A + B)C = AC + BC (Right Distributive)
4. k(AB) = (kA)B = A(kB)
5. AB ≠ BA in general (not commutative)
[/theorem]

[theorem:Properties of Transpose]
1. (Aᵀ)ᵀ = A
2. (A + B)ᵀ = Aᵀ + Bᵀ
3. (kA)ᵀ = k(Aᵀ)
4. (AB)ᵀ = BᵀAᵀ (order reverses!)
5. AAᵀ and AᵀA are always symmetric.
[/theorem]

[example:Verifying (AB)ᵀ = BᵀAᵀ]
A:
[matrix]1,2;3,4[/matrix]

B:
[matrix]0,1;2,3[/matrix]

Left side — compute AB then transpose:
c₁₁=(1)(0)+(2)(2)=4, c₁₂=(1)(1)+(2)(3)=7
c₂₁=(3)(0)+(4)(2)=8, c₂₂=(3)(1)+(4)(3)=15

AB:
[matrix]4,7;8,15[/matrix]

(AB)ᵀ:
[matrix]4,8;7,15[/matrix]

Right side — compute BᵀAᵀ:
Bᵀ:
[matrix]0,2;1,3[/matrix]

Aᵀ:
[matrix]1,3;2,4[/matrix]

BᵀAᵀ: c₁₁=(0)(1)+(2)(2)=4, c₁₂=(0)(3)+(2)(4)=8
       c₂₁=(1)(1)+(3)(2)=7, c₂₂=(1)(3)+(3)(4)=15

BᵀAᵀ:
[matrix]4,8;7,15[/matrix]

✓ Same as (AB)ᵀ
[/example]

[theorem:Properties of Zero and Identity Matrices]
• A + Oₘₓₙ = A (Additive identity)
• A + (−A) = O
• AIₙ = IₘA = A
• AOₙₓₚ = Oₘₓₚ
• If kA = O, then k = 0 or A = O
[/theorem]

[note]Important differences from real-number algebra:
• AC = BC does not imply A = B (cannot cancel C unless C is invertible)
• AB = O does not imply A = O or B = O
• AB ≠ BA in general[/note]
END,
            ],
        ];
    }

    // ── Chapter 2: Systems of Linear Equations ────────────────────────────────

    private function ch2Subtopics(): array
    {
        return [
            [
                'name'  => '2.1 Linear Equations',
                'desc'  => 'Standard form, leading coefficient, and solution sets',
                'order' => 1,
                'syllabus' => <<<'END'
[def:Linear Equation]
A linear equation with n variables x₁, x₂, …, xₙ has the form:
[rule]a₁x₁ + a₂x₂ + … + aₙxₙ = b[/rule]
where a₁, …, aₙ, b are real constants. The first nonzero coefficient is the leading coefficient and its variable is the leading variable.
[/def]

[example:Linear vs Non-Linear]
✓  3x₁ − 5x₂ + 2x₃ = 7   (all variables to the first power)
✓  x − y = 1               (two-variable linear equation)
✓  ½x + 0y − 4z = 0       (coefficients can be fractions)
✗  x₁x₂ + x₃ = 4          (product of variables: nonlinear)
✗  cos(x₁) + x₂ = 3       (nonlinear function of variable)
✗  x₁² + x₂ = 5           (variable squared: nonlinear)
✗  1/x₁ + x₂ = 5          (variable in denominator: nonlinear)
[/example]

[def:Solution of a Linear Equation]
A solution is a set of values (s₁, s₂, …, sₙ) that satisfies the equation when substituted for x₁, …, xₙ. A linear equation with more than one variable typically has infinitely many solutions, which can be expressed parametrically.
[/def]

[example:Finding Solutions: Step by Step]
Equation: 2x + 3y = 12 (two variables)

This has infinitely many solutions. Express x in terms of y:
2x = 12 − 3y
x  = 6 − (3/2)y

Let y = t (a free parameter). The solution set is:
[rule]x = 6 − (3/2)t,   y = t   for any real t[/rule]

Specific solutions:
t = 0: (x, y) = (6, 0)  → check: 2(6)+3(0) = 12 ✓
t = 2: (x, y) = (3, 2)  → check: 2(3)+3(2) = 12 ✓
t = 4: (x, y) = (0, 4)  → check: 2(0)+3(4) = 12 ✓
[/example]
END,
            ],
            [
                'name'  => '2.2 Systems of Linear Equations',
                'desc'  => 'Matrix form AX = B, augmented matrix, types of solutions',
                'order' => 2,
                'syllabus' => <<<'END'
[def:System of Linear Equations]
A system is a collection of two or more linear equations with the same variables. A solution must satisfy all equations simultaneously.
[/def]

[def:Matrix Form AX = B]
Any system can be written as AX = B where:
• A — coefficient matrix (m × n)
• X — column vector of unknowns (n × 1)
• B — column vector of constants (m × 1)
[/def]

[example:Converting to Matrix Form: Step by Step]
System:
2x + 3y = 7
 x −  y = 1

Step 1: Coefficient matrix A:
[matrix]2,3;1,-1[/matrix]

Step 2: Unknown vector X:
[matrix]x;y[/matrix]

Step 3: Constant vector B:
[matrix]7;1[/matrix]

Step 4: The system AX = B is:
[matrix]2,3;1,-1[/matrix] [matrix]x;y[/matrix] = [matrix]7;1[/matrix]
[/example]

[def:Augmented Matrix [A | B]]
Combines the coefficient matrix A with constant vector B into a single matrix. Contains all information needed to solve the system.

For 2x + 3y = 7, x − y = 1:
[aug]2,3;1,-1|7,1[/aug]

Each row represents one equation. The vertical bar separates coefficients from constants. All row operations are applied to the entire augmented matrix.
[/def]

[theorem:Types of Solutions]
A system has exactly one of three outcomes:
• Unique solution (consistent, independent): lines/planes meet at exactly one point
• No solution (inconsistent): a contradiction row appears, e.g. 0 = 5
• Infinitely many solutions (consistent, dependent): free variables exist
[/theorem]
END,
            ],
            [
                'name'  => '2.3 Elementary Row Operations',
                'desc'  => 'Three operations, row echelon form, and RREF',
                'order' => 3,
                'syllabus' => <<<'END'
[def:Three Elementary Row Operations]
These transform a system's augmented matrix without changing its solution set:
1. Row interchange — swap two rows: Rᵢ ↔ Rⱼ
2. Row scaling — multiply a row by nonzero k: Rᵢ → kRᵢ
3. Row replacement — add a multiple of one row to another: Rᵢ → Rᵢ + kRⱼ
[/def]

[example:Applying Row Operations: Step by Step]
System: x + y + z = 6,   x + 2y + 3z = 14,   x + 4y + 9z = 36

Augmented matrix:
[aug]1,1,1;1,2,3;1,4,9|6,14,36[/aug]

[step:1:R₂ → R₂ − R₁  (eliminate x from row 2)]
New R₂ = [1−1, 2−1, 3−1 | 14−6] = [0, 1, 2 | 8]
[aug]1,1,1;0,1,2;1,4,9|6,8,36[/aug]
[/step]

[step:2:R₃ → R₃ − R₁  (eliminate x from row 3)]
New R₃ = [1−1, 4−1, 9−1 | 36−6] = [0, 3, 8 | 30]
[aug]1,1,1;0,1,2;0,3,8|6,8,30[/aug]
[/step]

[step:3:R₃ → R₃ − 3R₂  (eliminate y from row 3)]
3R₂ = [0, 3, 6 | 24]
New R₃ = [0, 0, 2 | 6]
[aug]1,1,1;0,1,2;0,0,2|6,8,6[/aug]

This is now in Row Echelon Form (REF).
[/step]
[/example]

[def:Row Echelon Form (REF)]
A matrix is in REF when:
• All zero rows are at the bottom
• Each row's leading entry (pivot) is strictly to the right of the pivot in the row above
• All entries below a pivot are zero

REF example:
[aug]1,2,3;0,1,5;0,0,1|4,6,7[/aug]
[/def]

[def:Reduced Row Echelon Form (RREF)]
RREF is REF with two extra conditions:
• Each pivot equals 1
• Each pivot is the only nonzero entry in its column (zeros above and below)

RREF example:
[aug]1,0,0;0,1,0;0,0,1|a,b,c[/aug]
[/def]

[note]RREF is unique for any matrix: every sequence of valid row operations leads to the same RREF. REF is not unique; different operation sequences may produce different REFs that all represent the same solution set.[/note]
END,
            ],
            [
                'name'  => '2.4 Gaussian and Gauss-Jordan Elimination',
                'desc'  => 'Solving systems by row reduction to REF and RREF',
                'order' => 4,
                'syllabus' => <<<'END'
[def:Gaussian Elimination]
Solve a system by reducing its augmented matrix to REF, then applying back substitution (solving from the bottom equation upward).
1. Write the augmented matrix [A | B]
2. Apply row operations to reach REF
3. Back-substitute from the last equation upward
[/def]

[example:Gaussian Elimination: Complete Worked Example]
Solve: x + y + z = 6,   x + 2y + 3z = 14,   x + 4y + 9z = 36

Phase 1: Reduce to REF

[step:1:Write augmented matrix]
[aug]1,1,1;1,2,3;1,4,9|6,14,36[/aug]
[/step]

[step:2:R₂ → R₂ − R₁]
[1−1, 2−1, 3−1 | 14−6] = [0, 1, 2 | 8]
[aug]1,1,1;0,1,2;1,4,9|6,8,36[/aug]
[/step]

[step:3:R₃ → R₃ − R₁]
[1−1, 4−1, 9−1 | 36−6] = [0, 3, 8 | 30]
[aug]1,1,1;0,1,2;0,3,8|6,8,30[/aug]
[/step]

[step:4:R₃ → R₃ − 3R₂]
3R₂ = [0,3,6|24]. New R₃ = [0, 0, 2 | 6]
[aug]1,1,1;0,1,2;0,0,2|6,8,6[/aug]
← REF reached
[/step]

Phase 2: Back Substitution

[step:5:Row 3 — solve for z]
2z = 6  →  z = 3
[/step]

[step:6:Row 2 — substitute z = 3, solve for y]
y + 2(3) = 8  →  y + 6 = 8  →  y = 2
[/step]

[step:7:Row 1 — substitute y = 2, z = 3, solve for x]
x + 2 + 3 = 6  →  x + 5 = 6  →  x = 1
[/step]

Solution: x = 1, y = 2, z = 3
Verify: 1+2+3 = 6 ✓  |  1+4+9 = 14 ✓  |  1+8+27 = 36 ✓
[/example]

[def:Gauss-Jordan Elimination]
Extends Gaussian elimination by reducing all the way to RREF — solutions are read directly with no back substitution needed.
1. Write the augmented matrix [A | B]
2. Apply row operations to reach RREF
3. Read the solution directly from the final matrix
[/def]

[example:Gauss-Jordan Elimination: Complete Worked Example]
Solve: x + 2y − z = 3,   2x + 3y + z = 8,   −x + y + 2z = 1

Phase 1: Forward elimination

[step:1:Write augmented matrix]
[aug]1,2,-1;2,3,1;-1,1,2|3,8,1[/aug]
[/step]

[step:2:R₂ → R₂ − 2R₁]
2R₁=[2,4,−2|6]. New R₂=[0,−1,3|2]
[aug]1,2,-1;0,-1,3;-1,1,2|3,2,1[/aug]
[/step]

[step:3:R₃ → R₃ + R₁]
New R₃=[0,3,1|4]
[aug]1,2,-1;0,-1,3;0,3,1|3,2,4[/aug]
[/step]

[step:4:R₂ → −R₂  (make pivot = 1)]
New R₂=[0,1,−3|−2]
[aug]1,2,-1;0,1,-3;0,3,1|3,-2,4[/aug]
[/step]

[step:5:R₃ → R₃ − 3R₂]
3R₂=[0,3,−9|−6]. New R₃=[0,0,10|10]
[aug]1,2,-1;0,1,-3;0,0,10|3,-2,10[/aug]
[/step]

[step:6:R₃ → (1/10)R₃  (make pivot = 1)]
New R₃=[0,0,1|1]
[aug]1,2,-1;0,1,-3;0,0,1|3,-2,1[/aug]
← REF reached
[/step]

Phase 2: Back elimination

[step:7:R₂ → R₂ + 3R₃  (eliminate z from row 2)]
3R₃=[0,0,3|3]. New R₂=[0,1,0|1]
[aug]1,2,-1;0,1,0;0,0,1|3,1,1[/aug]
[/step]

[step:8:R₁ → R₁ + R₃  (eliminate z from row 1)]
New R₁=[1,2,0|4]
[aug]1,2,0;0,1,0;0,0,1|4,1,1[/aug]
[/step]

[step:9:R₁ → R₁ − 2R₂  (eliminate y from row 1)]
2R₂=[0,2,0|2]. New R₁=[1,0,0|2]
[aug]1,0,0;0,1,0;0,0,1|2,1,1[/aug]
← RREF
[/step]

Solution: x = 2, y = 1, z = 1
Verify: 2+2−1 = 3 ✓  |  4+3+1 = 8 ✓  |  −2+1+2 = 1 ✓
[/example]

[theorem:Consistency via Rank]
For system AX = B with augmented matrix [A | B], let n = number of unknowns:
• rank(A) = rank([A|B]) = n  →  unique solution
• rank(A) = rank([A|B]) < n  →  infinitely many solutions
• rank(A) < rank([A|B])      →  no solution (inconsistent)
[/theorem]
END,
            ],
        ];
    }

    // ── Chapter 3: Determinants ───────────────────────────────────────────────

    private function ch3Subtopics(): array
    {
        return [
            [
                'name'  => '3.1 Determinant Formulas',
                'desc'  => '1×1, 2×2 formula, and 3×3 Sarrus\' Rule',
                'order' => 1,
                'syllabus' => <<<'END'
[def:Determinant]
A determinant is a unique real number associated with any square matrix A, written det(A) or |A|. Only square matrices have determinants.
[/def]

[def:1×1 and 2×2 Determinants]
1×1: If A = (a), then det(A) = a

2×2 formula:
[rule]det([a,b;c,d]) = ad − bc   (main diagonal product minus anti-diagonal product)[/rule]
[/def]

[example:2×2 Determinants: Step by Step]
Example 1:
[matrix]3,2;1,4[/matrix]
Main diagonal: 3 × 4 = 12
Anti-diagonal: 2 × 1 = 2
det = 12 − 2 = 10

Example 2:
[matrix]-2,3;4,-1[/matrix]
Main diagonal: (−2) × (−1) = 2
Anti-diagonal:  3 × 4 = 12
det = 2 − 12 = −10

Example 3 (singular matrix):
[matrix]1,2;2,4[/matrix]
Main diagonal: 1 × 4 = 4
Anti-diagonal: 2 × 2 = 4
det = 4 − 4 = 0  (singular: no inverse exists)
[/example]

[def:3×3 Determinant: Sarrus' Rule]
Copy the first two columns to the right of the 3×3 matrix. Then:
• Add the three main diagonal products (top-left → bottom-right direction)
• Subtract the three anti-diagonal products (top-right → bottom-left direction)

[note]Sarrus' Rule applies only to 3×3 matrices. For 4×4 and larger, use cofactor expansion or row operations.[/note]
[/def]

[example:Sarrus' Rule: Complete Worked Example]
A:
[matrix]1,2,0;3,-1,4;2,1,-2[/matrix]

Step 1: Label all elements.
a₁₁=1, a₁₂=2,  a₁₃=0
a₂₁=3, a₂₂=−1, a₂₃=4
a₃₁=2, a₃₂=1,  a₃₃=−2

Step 2: Three positive diagonal products (↘ direction):
P₁ = 1 × (−1) × (−2) = +2
P₂ = 2 × 4 × 2       = +16
P₃ = 0 × 3 × 1       = 0
Positive sum = 2 + 16 + 0 = 18

Step 3: Three negative diagonal products (↙ direction):
N₁ = 0 × (−1) × 2    = 0
N₂ = 1 × 4 × 1       = +4
N₃ = 2 × 3 × (−2)    = −12
Negative sum = 0 + 4 + (−12) = −8

Step 4: det(A) = Positive sum − Negative sum
det(A) = 18 − (−8) = 18 + 8 = 26
[/example]
END,
            ],
            [
                'name'  => '3.2 Cofactor Expansion',
                'desc'  => 'Minors, cofactors, expansion theorem, and triangular matrices',
                'order' => 2,
                'syllabus' => <<<'END'
[def:Minor Mᵢⱼ]
For an n×n matrix A, the minor Mᵢⱼ of element aᵢⱼ is the determinant of the (n−1)×(n−1) submatrix obtained by deleting row i and column j from A.
[/def]

[def:Cofactor Cᵢⱼ]
The cofactor of aᵢⱼ is the signed minor:
[rule]Cᵢⱼ = (−1)^(i+j) × Mᵢⱼ[/rule]

The sign factor follows a checkerboard pattern:
If i+j is even → +,  if i+j is odd → −

Sign pattern for 3×3:
[matrix]+,−,+;−,+,−;+,−,+[/matrix]
[/def]

[theorem:Cofactor Expansion]
The determinant of an n×n matrix A equals the cofactor expansion along any row i or column j:

Along row i:   det(A) = aᵢ₁Cᵢ₁ + aᵢ₂Cᵢ₂ + … + aᵢₙCᵢₙ
Along col j:   det(A) = a₁ⱼC₁ⱼ + a₂ⱼC₂ⱼ + … + aₙⱼCₙⱼ

[note]Choose the row or column with the most zeros to minimize calculations.[/note]
[/theorem]

[example:Cofactor Expansion: Complete Worked Example]
A:
[matrix]1,2,3;0,4,5;1,0,6[/matrix]

Expand along row 1 (a₁₁=1, a₁₂=2, a₁₃=3).

[step:1:Compute M₁₁ and C₁₁  (delete row 1, col 1)]
Submatrix:
[matrix]4,5;0,6[/matrix]
M₁₁ = 4×6 − 5×0 = 24
C₁₁ = (−1)^(1+1) × 24 = +24
[/step]

[step:2:Compute M₁₂ and C₁₂  (delete row 1, col 2)]
Submatrix:
[matrix]0,5;1,6[/matrix]
M₁₂ = 0×6 − 5×1 = −5
C₁₂ = (−1)^(1+2) × (−5) = +5
[/step]

[step:3:Compute M₁₃ and C₁₃  (delete row 1, col 3)]
Submatrix:
[matrix]0,4;1,0[/matrix]
M₁₃ = 0×0 − 4×1 = −4
C₁₃ = (−1)^(1+3) × (−4) = −4
[/step]

[step:4:Apply the expansion formula]
det(A) = a₁₁·C₁₁ + a₁₂·C₁₂ + a₁₃·C₁₃
       = 1(24) + 2(5) + 3(−4)
       = 24 + 10 − 12
       = 22
[/step]
[/example]

[theorem:Determinants of Triangular Matrices]
The determinant of any triangular matrix (upper, lower, or diagonal) equals the product of its main diagonal entries:
[rule]det(A) = a₁₁ × a₂₂ × … × aₙₙ[/rule]

Example:
[matrix]2,3,1;0,-4,5;0,0,3[/matrix]
det = 2 × (−4) × 3 = −24

[note]This is why we reduce to triangular form: multiplying the diagonal is much faster than full cofactor expansion.[/note]
[/theorem]
END,
            ],
            [
                'name'  => '3.3 Elementary Operations Method',
                'desc'  => 'Row/column operations and their effect on determinants',
                'order' => 3,
                'syllabus' => <<<'END'
[theorem:Effect of Row Operations on Determinant]
If B is obtained from A by an elementary row operation:
1. Rᵢ ↔ Rⱼ (swap): det(B) = −det(A)  (sign changes)
2. Rᵢ → kRᵢ (scale): det(B) = k · det(A)  (multiplied by k)
3. Rᵢ → Rᵢ + kRⱼ (replace): det(B) = det(A)  (unchanged)

[note]The same rules apply to column operations. However, column operations cannot be used to solve a system of linear equations.[/note]
[/theorem]

[theorem:Matrices with Zero Determinant]
det(A) = 0 if A has:
• A zero row or zero column
• Two identical rows or two identical columns
• One row (or column) that is a scalar multiple of another
[/theorem]

[theorem:Key Determinant Properties]
• det(Aᵀ) = det(A)
• det(AB) = det(A) · det(B)
• det(kA) = kⁿ · det(A)   (A is n×n)
• det(A⁻¹) = 1 / det(A)
• A is invertible ↔ det(A) ≠ 0
[/theorem]

[example:Row Operations Method: Complete Worked Example]
Find det(A):
[matrix]2,1,-1;4,5,3;-2,3,2[/matrix]

Strategy: Reduce to upper triangular form, then multiply the main diagonal.

[step:1:R₂ → R₂ − 2R₁  (row replacement: det unchanged)]
2R₁ = [4, 2, −2]. New R₂ = [4−4, 5−2, 3−(−2)] = [0, 3, 5]
[matrix]2,1,-1;0,3,5;-2,3,2[/matrix]
[/step]

[step:2:R₃ → R₃ + R₁  (row replacement: det unchanged)]
New R₃ = [−2+2, 3+1, 2+(−1)] = [0, 4, 1]
[matrix]2,1,-1;0,3,5;0,4,1[/matrix]
[/step]

[step:3:R₃ → R₃ − (4/3)R₂  (row replacement: det unchanged)]
(4/3)R₂ = [0, 4, 20/3]. New R₃ = [0, 0, 1−20/3] = [0, 0, −17/3]
[matrix]2,1,-1;0,3,5;0,0,−17/3[/matrix]
← upper triangular
[/step]

[step:4:Compute det from diagonal product]
det(A) = 2 × 3 × (−17/3) = 6 × (−17/3) = −102/3 = −34
[/step]

Since det(A) ≠ 0, the matrix is invertible.
[/example]

[example:Effect of Row Swap on Determinant]
A:
[matrix]1,2;3,4[/matrix]
det(A) = 1×4 − 2×3 = −2

Swap rows R₁ ↔ R₂ to get B:
[matrix]3,4;1,2[/matrix]
det(B) = 3×2 − 4×1 = 2

det(B) = −det(A) = −(−2) = 2 ✓  (sign reversed by the swap)
[/example]
END,
            ],
            [
                'name'  => '3.4 Applications of Determinants',
                'desc'  => 'Finding inverse via adj(A) and Cramer\'s Rule',
                'order' => 4,
                'syllabus' => <<<'END'
[def:Adjoint (Adjugate) Matrix]
The adjoint of A, written adj(A), is the transpose of the cofactor matrix.
1. Compute every cofactor Cᵢⱼ
2. Form the cofactor matrix [Cᵢⱼ]
3. Transpose it → adj(A) = [Cᵢⱼ]ᵀ
[/def]

[theorem:Inverse via Adjoint]
If det(A) ≠ 0, then A is invertible and:
[rule]A⁻¹ = (1 / det(A)) · adj(A)[/rule]
[/theorem]

[example:Finding A⁻¹ Using Adjoint: Complete Steps]
A:
[matrix]1,2;3,4[/matrix]

[step:1:Compute det(A)]
det(A) = 1×4 − 2×3 = 4 − 6 = −2
Since det(A) ≠ 0, A is invertible.
[/step]

[step:2:Compute all four cofactors]
C₁₁ = (−1)^(1+1) × det([4]) = (+1)(4) = 4
C₁₂ = (−1)^(1+2) × det([3]) = (−1)(3) = −3
C₂₁ = (−1)^(2+1) × det([2]) = (−1)(2) = −2
C₂₂ = (−1)^(2+2) × det([1]) = (+1)(1) = 1
[/step]

[step:3:Form the cofactor matrix]
[matrix]4,-3;-2,1[/matrix]
[/step]

[step:4:Transpose to get adj(A)]
adj(A):
[matrix]4,-2;-3,1[/matrix]
[/step]

[step:5:Compute A⁻¹ = (1/det) × adj(A)]
A⁻¹ = (1/−2) × adj(A):
[matrix]-2,1;3/2,−1/2[/matrix]
[/step]

[step:6:Verify: A × A⁻¹ = I]
c₁₁ = (1)(−2)+(2)(3/2) = −2+3 = 1
c₁₂ = (1)(1)+(2)(−1/2) = 1−1 = 0
c₂₁ = (3)(−2)+(4)(3/2) = −6+6 = 0
c₂₂ = (3)(1)+(4)(−1/2) = 3−2 = 1

Result = I₂ ✓
[/step]
[/example]

[theorem:Cramer's Rule]
For system AX = B with det(A) ≠ 0, each unknown xᵢ is:
[rule]xᵢ = det(Aᵢ) / det(A)[/rule]
where Aᵢ is matrix A with column i replaced by vector B.
[/theorem]

[example:Cramer's Rule: Complete Worked Example]
Solve: 2x + y = 5,   3x − 2y = 4

[step:1:Write matrix A and vector B]
A:
[matrix]2,1;3,-2[/matrix]

B:
[matrix]5;4[/matrix]
[/step]

[step:2:Compute det(A)]
det(A) = 2×(−2) − 1×3 = −4 − 3 = −7
[/step]

[step:3:Solve for x — replace column 1 with B to form A₁]
A₁:
[matrix]5,1;4,-2[/matrix]
det(A₁) = 5×(−2) − 1×4 = −10 − 4 = −14
x = det(A₁) / det(A) = −14 / −7 = 2
[/step]

[step:4:Solve for y — replace column 2 with B to form A₂]
A₂:
[matrix]2,5;3,4[/matrix]
det(A₂) = 2×4 − 5×3 = 8 − 15 = −7
y = det(A₂) / det(A) = −7 / −7 = 1
[/step]

Solution: x = 2, y = 1
Verify: 2(2)+1 = 5 ✓  |  3(2)−2(1) = 4 ✓

[note]Cramer's Rule is useful for theoretical work and small systems. For larger systems, Gaussian elimination is computationally more efficient since it avoids computing n+1 determinants.[/note]
[/example]
END,
            ],
        ];
    }
}
