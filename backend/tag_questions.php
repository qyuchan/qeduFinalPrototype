<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Step 1: Add subtopic_id column to questions
DB::statement("ALTER TABLE questions ADD COLUMN IF NOT EXISTS subtopic_id VARCHAR(10) NULL");
echo "Column added.\n";

// Step 2: subtopic_id mapping for every question
// 1.1 = Introduction to Matrices (definition, size, equality, transpose basics)
// 1.2 = Types of Matrices (triangular, diagonal, identity, zero, symmetric, skew-sym, orthogonal, special types)
// 1.3 = Matrix Operations (addition, subtraction, scalar mult, multiplication, power, mixed ops)
// 1.4 = Properties & Theorems (algebraic laws, inverse, rank, RREF, trace, eigenvalues, Cayley-Hamilton)
// 2.1 = Linear Equations (standard form, solution sets, overdetermined, underdetermined, geometric meaning)
// 2.2 = Systems of Linear Equations (matrix form AX=B, augmented matrix, types of solutions, consistency, rank)
// 2.3 = Elementary Row Operations (row ops, REF, RREF, rank, free variables, null space)
// 2.4 = Gaussian & Gauss-Jordan Elimination (solving by row reduction, back-sub, Cramer, inverse method)
// 3.1 = Determinant Formulas (1x1, 2x2, 3x3 Sarrus, diagonal/triangular det)
// 3.2 = Cofactor Expansion (minors, cofactors, expansion theorem, triangular det via cofactors)
// 3.3 = Elementary Operations Method (row ops effect on det, scalar, swap, properties, dependence)
// 3.4 = Applications of Determinants (inverse via adj, Cramer, invertibility, eigenvalues, geometric)

$mapping = [
    // ── Matrices Quiz 1 (IDs 1-10) ─────────────────────────────────────────────
    1  => '1.3', // Matrix Addition
    2  => '1.1', // Transpose (definition)
    3  => '1.3', // Matrix Multiplication
    4  => '1.2', // Special Matrices (identity)
    5  => '1.3', // Matrix Multiplication (dimensions)
    6  => '1.2', // Matrix Types (symmetric)
    7  => '1.3', // Matrix Operations (invalid)
    8  => '1.2', // Special Matrices (idempotent)
    9  => '1.3', // Scalar Multiplication
    10 => '1.2', // Matrix Types (upper triangular)

    // ── Matrices Quiz 4 (IDs 31-40, same questions as Quiz 1) ──────────────────
    31 => '1.3', 32 => '1.1', 33 => '1.3', 34 => '1.2', 35 => '1.3',
    36 => '1.2', 37 => '1.3', 38 => '1.2', 39 => '1.3', 40 => '1.2',

    // ── Matrices Quiz 5 (IDs 41-50): Dimensions & Types ──────────────────────
    41 => '1.1', // Matrix Dimensions (order)
    42 => '1.1', // Matrix Types (square)
    43 => '1.1', // Matrix Types (row matrix)
    44 => '1.2', // Matrix Types (zero matrix)
    45 => '1.2', // Matrix Types (diagonal)
    46 => '1.1', // Matrix Equality
    47 => '1.1', // Matrix Dimensions (elements)
    48 => '1.1', // Matrix Types (column matrix)
    49 => '1.2', // Matrix Types (scalar matrix)
    50 => '1.3', // Matrix Operations (order of A+B)

    // ── Matrices Quiz 6 (IDs 51-60): Operations & Properties ─────────────────
    51 => '1.3', // Matrix Subtraction
    52 => '1.4', // Matrix Properties (commutativity)
    53 => '1.3', // Scalar Multiplication
    54 => '1.4', // Transpose property (A+B)^T
    55 => '1.3', // Mixed Operations
    56 => '1.4', // Transpose property (cA)^T
    57 => '1.3', // Matrix Addition
    58 => '1.3', // Scalar Multiplication
    59 => '1.4', // Matrix Properties (A + (-A) = 0)
    60 => '1.3', // Matrix Subtraction (formula)

    // ── Matrices Quiz 7 (IDs 61-70): Multiplication ──────────────────────────
    61 => '1.3', // Matrix Multiplication (entry)
    62 => '1.3', // Matrix Multiplication (size)
    63 => '1.3', // Matrix Multiplication (undefined)
    64 => '1.2', // Identity Matrix
    65 => '1.4', // Associativity property
    66 => '1.4', // Distributive Law
    67 => '1.2', // Identity Matrix
    68 => '1.3', // Matrix Multiplication (entry)
    69 => '1.3', // Matrix Power
    70 => '1.4', // Commutativity property

    // ── Matrices Quiz 8 (IDs 71-80): Transpose & Symmetry ────────────────────
    71 => '1.1', // Transpose (basic)
    72 => '1.4', // (A^T)^T = A property
    73 => '1.2', // Symmetric Matrix type
    74 => '1.2', // Symmetric Matrix check
    75 => '1.4', // (AB)^T = B^T A^T
    76 => '1.1', // Transpose size
    77 => '1.2', // Skew-Symmetric type
    78 => '1.2', // Skew-Symmetric type
    79 => '1.4', // Symmetric property (A+B)
    80 => '1.3', // Symmetric: A + A^T

    // ── Matrices Quiz 9 (IDs 81-90): Special Matrices ─────────────────────────
    81 => '1.4', // Trace
    82 => '1.4', // Trace formula
    83 => '1.2', // Orthogonal Matrix type
    84 => '1.4', // Matrix Rank property
    85 => '1.2', // Special Matrix (involutory)
    86 => '1.2', // Special Matrix (nilpotent)
    87 => '1.4', // Property: sym + skew-sym = 0
    88 => '1.4', // Trace under similarity
    89 => '1.2', // Special Matrix (idempotent)
    90 => '1.4', // Triangular det property

    // ── Matrices Quiz 10 (IDs 91-100): Matrix Inverse ─────────────────────────
    91  => '1.4', 92  => '1.4', 93  => '1.4', 94  => '1.4', 95  => '1.4',
    96  => '1.4', 97  => '1.4', 98  => '1.4', 99  => '1.4', 100 => '1.4',

    // ── Matrices Quiz 11 (IDs 101-110): Row Ops / REF ─────────────────────────
    101 => '1.4', 102 => '1.4', 103 => '1.4', 104 => '1.4', 105 => '1.4',
    106 => '1.4', 107 => '1.4', 108 => '1.4', 109 => '1.4', 110 => '1.4',

    // ── Matrices Quiz 12 (IDs 111-120): Powers & Mixed ────────────────────────
    111 => '1.3', // Matrix Power/Multiplication
    112 => '1.4', // Matrix Inverse property
    113 => '1.3', // Matrix Power
    114 => '1.3', // Diagonal Matrix power
    115 => '1.4', // Property (AB)^2 condition
    116 => '1.4', // A^T A is symmetric (property)
    117 => '1.3', // Matrix Power
    118 => '1.4', // (AB)^T property
    119 => '1.4', // det(3A) property
    120 => '1.4', // Symmetric Matrix property

    // ── Matrices Quiz 13 (IDs 121-130): Advanced ───────────────────────────────
    121 => '1.4', 122 => '1.4', 123 => '1.4', 124 => '1.4', 125 => '1.4',
    126 => '1.4', 127 => '1.4', 128 => '1.4', 129 => '1.4', 130 => '1.4',

    // ── Determinants Quiz 2 (IDs 11-20) ─────────────────────────────────────────
    11 => '3.1', // 2×2 Determinant
    12 => '3.3', // Determinant Properties (singular)
    13 => '3.3', // Row Operations (swap)
    14 => '3.3', // Scalar Multiple det(2A)
    15 => '3.3', // Properties det(AB)
    16 => '3.1', // Special Matrices det(I)=1
    17 => '3.3', // Linear Dependence (det=0)
    18 => '3.3', // Transpose Property det(A^T)
    19 => '3.2', // Triangular Matrices
    20 => '3.2', // Cofactor Expansion

    // ── Determinants Quiz 14 (IDs 131-140, same as Quiz 2) ──────────────────────
    131 => '3.1', 132 => '3.3', 133 => '3.3', 134 => '3.3', 135 => '3.3',
    136 => '3.1', 137 => '3.3', 138 => '3.3', 139 => '3.2', 140 => '3.2',

    // ── Determinants Quiz 15 (IDs 141-150): 2×2 focus ─────────────────────────
    141 => '3.1', // 2×2 Determinant
    142 => '3.1', // 2×2 Determinant
    143 => '3.3', // Row Proportionality
    144 => '3.1', // Rotation Matrix det
    145 => '3.1', // Diagonal Determinant
    146 => '3.1', // 2×2 Determinant
    147 => '3.3', // Multiplicative Property
    148 => '3.3', // Determinant Power (det(A^2))
    149 => '3.1', // 2×2 Determinant
    150 => '3.1', // Determinant Equation 2×2

    // ── Determinants Quiz 16 (IDs 151-160): 3×3 ───────────────────────────────
    151 => '3.1', // Diagonal Determinant 3×3
    152 => '3.1', // Sarrus Rule
    153 => '3.1', // 3×3 Determinant
    154 => '3.2', // Triangular Determinant
    155 => '3.3', // Properties (identical rows)
    156 => '3.3', // Permutation Matrix det
    157 => '3.3', // Scalar Row effect
    158 => '3.2', // Triangular Determinant
    159 => '3.2', // Cofactor Expansion (efficiency)
    160 => '3.2', // Cofactor Expansion (row selection)

    // ── Determinants Quiz 17 (IDs 161-170): Cofactor Expansion ─────────────────
    161 => '3.2', // Minors
    162 => '3.2', // Cofactors
    163 => '3.2', // Cofactors sign
    164 => '3.2', // Cofactor Expansion theorem
    165 => '3.2', // Cofactor Expansion count
    166 => '3.4', // Adjugate
    167 => '3.4', // Inverse via Adjugate
    168 => '3.2', // Cofactor Expansion calculation
    169 => '3.2', // Cofactor Matrix
    170 => '3.2', // Cofactor Expansion

    // ── Determinants Quiz 18 (IDs 171-180): Properties ─────────────────────────
    171 => '3.3', // Properties (zero row)
    172 => '3.3', // Properties (det(A+B) false)
    173 => '3.3', // Row Operations (add multiple)
    174 => '3.3', // Scalar Multiple det(-A)
    175 => '3.3', // Scalar Multiple (odd n)
    176 => '3.4', // Orthogonal Matrix (det=±1)
    177 => '3.4', // det(A^{-1}) = 1/det(A)
    178 => '3.3', // Scalar Row effect
    179 => '3.4', // Block Matrix det
    180 => '3.3', // Linear Dependence

    // ── Determinants Quiz 19 (IDs 181-190): Applications ───────────────────────
    181 => '3.4', // Invertibility
    182 => '3.4', // Homogeneous System
    183 => '3.4', // Determinant Calculation
    184 => '3.4', // Invertibility
    185 => '3.4', // Singular Matrix
    186 => '3.3', // Properties (same det ≠ same matrix)
    187 => '3.1', // Identity Determinant
    188 => '3.4', // Similar Matrices
    189 => '3.4', // Inverse Determinant 2×2
    190 => '3.4', // Determinant Equation A³=I

    // ── Determinants Quiz 20 (IDs 191-200): Cramer's Rule ──────────────────────
    191 => '3.4', 192 => '3.4', 193 => '3.4', 194 => '3.4', 195 => '3.4',
    196 => '3.4', 197 => '3.4', 198 => '3.4', 199 => '3.4', 200 => '3.4',

    // ── Determinants Quiz 21 (IDs 201-210): Geometric Applications ─────────────
    201 => '3.4', 202 => '3.4', 203 => '3.4', 204 => '3.4', 205 => '3.4',
    206 => '3.4', 207 => '3.4', 208 => '3.4', 209 => '3.4', 210 => '3.4',

    // ── Determinants Quiz 22 (IDs 211-220): Mixed Challenge ────────────────────
    211 => '3.3', // det(A+B) - properties
    212 => '3.4', // Singular Condition (find k)
    213 => '3.2', // Triangular Determinant
    214 => '3.3', // Determinant Laws (det(A²B³))
    215 => '3.3', // Row Operations (add multiple, det unchanged)
    216 => '3.2', // Triangular Determinant sum
    217 => '3.3', // det(AB) = det(A)det(B)
    218 => '3.2', // Triangular Determinant (upper triangular det=1)
    219 => '3.1', // Rotation Matrix (90°)
    220 => '3.3', // det(A + A^T)

    // ── Determinants Quiz 23 (IDs 221-230): Advanced ───────────────────────────
    221 => '3.4', // Characteristic Polynomial
    222 => '3.4', // Eigenvalues
    223 => '3.4', // Eigenvalues (det(A-λI)=0)
    224 => '3.4', // Characteristic Polynomial degree
    225 => '3.2', // Cofactor Expansion (formula)
    226 => '3.4', // Permanent (advanced)
    227 => '3.4', // Eigenvalues from char poly
    228 => '3.3', // Properties (det(A+B) false)
    229 => '3.4', // Determinant Equation
    230 => '3.4', // Cayley-Hamilton

    // ── Systems Quiz 3 (IDs 21-30) ─────────────────────────────────────────────
    21 => '2.2', // System Classification
    22 => '2.4', // Gaussian Elimination
    23 => '2.4', // Solving Systems
    24 => '2.2', // System Classification (inconsistent)
    25 => '2.4', // Cramer's Rule
    26 => '2.3', // Row Operations
    27 => '2.2', // Solution Types (infinitely many)
    28 => '2.2', // Matrix Equations (unique solution)
    29 => '2.3', // Row Echelon Form
    30 => '2.4', // Back-Substitution

    // ── Systems Quiz 24 (IDs 231-240, same as Quiz 3) ───────────────────────────
    231 => '2.2', 232 => '2.4', 233 => '2.4', 234 => '2.2', 235 => '2.4',
    236 => '2.3', 237 => '2.2', 238 => '2.2', 239 => '2.3', 240 => '2.4',

    // ── Systems Quiz 25 (IDs 241-250): Augmented Matrix ────────────────────────
    241 => '2.2', // Augmented Matrix (matrix equation)
    242 => '2.2', // Augmented Matrix
    243 => '2.2', // Augmented Matrix (3×4 = 3 eq, 3 unknowns)
    244 => '2.1', // System Classification (overdetermined)
    245 => '2.1', // Underdetermined Systems
    246 => '2.2', // Augmented Matrix (coeff matrix)
    247 => '2.2', // Verification
    248 => '2.2', // Solution Types (consistent dependent)
    249 => '2.3', // RREF Solution
    250 => '2.3', // Free Variables

    // ── Systems Quiz 26 (IDs 251-260): Gaussian / Gauss-Jordan ─────────────────
    251 => '2.4', // Gaussian Elimination
    252 => '2.4', // Gauss-Jordan
    253 => '2.3', // Row Operations (eliminate)
    254 => '2.4', // Back-Substitution
    255 => '2.2', // Inconsistent System
    256 => '2.2', // Infinitely Many Solutions
    257 => '2.3', // Row Operations
    258 => '2.4', // Pivoting
    259 => '2.4', // Back-Substitution (z)
    260 => '2.4', // Back-Substitution (y)

    // ── Systems Quiz 27 (IDs 261-270): Gauss-Jordan & Inverse ──────────────────
    261 => '2.4', // Gauss-Jordan
    262 => '2.3', // RREF
    263 => '2.3', // RREF (which matrix is)
    264 => '2.4', // Gauss-Jordan (solve)
    265 => '2.4', // Matrix Inverse via G-J
    266 => '2.4', // Matrix Inverse via G-J
    267 => '2.4', // Matrix Inverse via G-J (when can't)
    268 => '2.4', // Gauss-Jordan advantage
    269 => '2.4', // Gauss-Jordan (elimination direction)
    270 => '2.4', // Inverse Method solve

    // ── Systems Quiz 28 (IDs 271-280): Cramer's Rule ───────────────────────────
    271 => '2.4', 272 => '2.4', 273 => '2.4', 274 => '2.4', 275 => '2.4',
    276 => '2.4', 277 => '2.4', 278 => '2.4', 279 => '2.4', 280 => '2.4',

    // ── Systems Quiz 29 (IDs 281-290): Inverse Method ──────────────────────────
    281 => '2.4', 282 => '2.4', 283 => '2.4', 284 => '2.4', 285 => '2.4',
    286 => '2.4', 287 => '2.4', 288 => '2.4', 289 => '2.4', 290 => '2.4',

    // ── Systems Quiz 30 (IDs 291-300): Solution Types & Rank ───────────────────
    291 => '2.2', // Consistency
    292 => '2.3', // Rank (number of non-zero rows)
    293 => '2.2', // Uniqueness
    294 => '2.2', // Inconsistency
    295 => '2.2', // Infinite Solutions
    296 => '2.2', // Rouché-Capelli
    297 => '2.3', // Rank calculation
    298 => '2.2', // Infinite Solutions
    299 => '2.2', // Inconsistency ([0,0,0,5])
    300 => '2.2', // Homogeneous System

    // ── Systems Quiz 31 (IDs 301-310): Homogeneous & Null Space ────────────────
    301 => '2.2', // Homogeneous System (trivial)
    302 => '2.3', // Homogeneous (non-trivial iff det=0)
    303 => '2.3', // Free Variables (n-r)
    304 => '2.3', // Null Space (forms subspace)
    305 => '2.4', // General Solution
    306 => '2.1', // Underdetermined Homogeneous
    307 => '2.4', // Homogeneous → unique AX=B
    308 => '2.3', // Null Space (example)
    309 => '2.3', // Nullity (rank-nullity)
    310 => '2.4', // General Solution (det=0)

    // ── Systems Quiz 32 (IDs 311-320): Solving & RREF ──────────────────────────
    311 => '2.4', // Simple Systems (by inspection)
    312 => '2.2', // Solution Types (same eq 3×)
    313 => '2.3', // RREF Solution (read off)
    314 => '2.2', // Solution Types (infinite)
    315 => '2.2', // Inconsistency
    316 => '2.2', // Verification
    317 => '2.3', // RREF Solution
    318 => '2.3', // System Simplification
    319 => '2.1', // Free Variables (1 eq, 3 unknowns)
    320 => '2.1', // Linearity (superposition)

    // ── Systems Quiz 33 (IDs 321-330): Advanced ─────────────────────────────────
    321 => '2.1', // System Types (overdetermined m>n)
    322 => '2.4', // Least Squares
    323 => '2.3', // Null Space (dim = n-r)
    324 => '2.4', // Least Squares (normal equations)
    325 => '2.2', // Uniqueness (rank=n)
    326 => '2.1', // Geometric Interpretation (planes)
    327 => '2.1', // Geometric Interpretation (point)
    328 => '2.3', // Null Space (solution set)
    329 => '2.4', // Parametric Solution (line)
    330 => '2.1', // Linearity (3b1 - b2)
];

// Step 3: Batch update
$updated = 0;
foreach ($mapping as $qid => $subtopic) {
    $rows = DB::table('questions')
        ->where('question_id', $qid)
        ->update(['subtopic_id' => $subtopic]);
    $updated += $rows;
}

echo "Updated {$updated} questions with subtopic_id.\n";

// Verify
$untagged = DB::table('questions')->whereNull('subtopic_id')->count();
$total    = DB::table('questions')->count();
echo "Total questions: {$total}, still untagged: {$untagged}\n";
