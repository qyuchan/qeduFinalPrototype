-- ============================================================
-- ALMSLARSA Database Schema
-- Adaptive Learning Management System for Linear Algebra
-- Using Recommendation System Approach
-- ============================================================
-- Author  : `Naqiyudin bin Mohd Sany (2023276758)
-- System  : QEDU | Supervisor: Dr. Nurul Hijja Binti Mazlan
-- Engine  : MySQL 8.0+  |  Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS almslarsa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE almslarsa;

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- SECTION 1: USER MANAGEMENT
-- ============================================================

CREATE TABLE users (
    user_id       INT            PRIMARY KEY AUTO_INCREMENT,
    student_id    VARCHAR(20)    UNIQUE,                          -- e.g. 2023276758
    full_name     VARCHAR(100)   NOT NULL,
    username      VARCHAR(50)    UNIQUE NOT NULL,
    email         VARCHAR(100)   UNIQUE NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    role          ENUM('student','lecturer','admin') NOT NULL DEFAULT 'student',
    profile_picture VARCHAR(255) DEFAULT NULL,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    last_login    DATETIME       DEFAULT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    token_id    INT          PRIMARY KEY AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE user_sessions (
    session_id  VARCHAR(128) PRIMARY KEY,
    user_id     INT          NOT NULL,
    ip_address  VARCHAR(45)  DEFAULT NULL,
    user_agent  TEXT         DEFAULT NULL,
    expires_at  DATETIME     NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 2: STUDENT PROFILE
-- ============================================================

CREATE TABLE student_profiles (
    profile_id               INT            PRIMARY KEY AUTO_INCREMENT,
    user_id                  INT            NOT NULL UNIQUE,
    program                  VARCHAR(100)   DEFAULT NULL,      -- e.g. CS230 Multimedia Computing
    enrollment_year          YEAR           DEFAULT NULL,
    current_gpa              DECIMAL(3,2)   DEFAULT NULL,
    learning_style           ENUM('visual','auditory','reading','kinesthetic') DEFAULT NULL,
    overall_performance_score FLOAT         NOT NULL DEFAULT 0,
    total_time_spent_seconds  INT           NOT NULL DEFAULT 0,
    streak_days              INT            NOT NULL DEFAULT 0, -- consecutive study days
    created_at               TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 3: COURSE & CLASS MANAGEMENT
-- ============================================================

CREATE TABLE courses (
    course_id   INT          PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20)  NOT NULL UNIQUE,     -- e.g. MAT423
    course_name VARCHAR(150) NOT NULL,
    description TEXT         DEFAULT NULL,
    credit_hours TINYINT     NOT NULL DEFAULT 3,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by  INT          DEFAULT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE classes (
    class_id         INT          PRIMARY KEY AUTO_INCREMENT,
    course_id        INT          NOT NULL,
    lecturer_id      INT          NOT NULL,
    class_name       VARCHAR(50)  NOT NULL,        -- e.g. CS2304A
    semester         ENUM('1','2','short') NOT NULL,
    academic_year    VARCHAR(9)   NOT NULL,         -- e.g. 2024/2025
    enrollment_limit SMALLINT     NOT NULL DEFAULT 40,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)   REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(user_id)    ON DELETE RESTRICT
);

CREATE TABLE class_enrollments (
    enrollment_id INT       PRIMARY KEY AUTO_INCREMENT,
    class_id      INT       NOT NULL,
    student_id    INT       NOT NULL,
    status        ENUM('active','withdrawn','completed') NOT NULL DEFAULT 'active',
    enrolled_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrollment (class_id, student_id),
    FOREIGN KEY (class_id)   REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id)    ON DELETE CASCADE
);


-- ============================================================
-- SECTION 4: TOPIC / SYLLABUS HIERARCHY
-- Covers: Matrices | System of Linear Equations | Determinants
-- ============================================================

CREATE TABLE topics (
    topic_id        INT          PRIMARY KEY AUTO_INCREMENT,
    course_id       INT          NOT NULL,
    parent_topic_id INT          DEFAULT NULL,      -- enables sub-topic hierarchy
    topic_name      VARCHAR(150) NOT NULL,
    description     TEXT         DEFAULT NULL,
    sequence_order  SMALLINT     NOT NULL DEFAULT 1,
    difficulty_level ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
    estimated_hours DECIMAL(4,1) DEFAULT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)       REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_topic_id) REFERENCES topics(topic_id)  ON DELETE SET NULL
);

-- Enforces prerequisite chains (e.g. Matrices → Determinants)
CREATE TABLE topic_prerequisites (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    topic_id         INT NOT NULL,
    required_topic_id INT NOT NULL,
    UNIQUE KEY uq_prereq (topic_id, required_topic_id),
    FOREIGN KEY (topic_id)          REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (required_topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 5: LEARNING MATERIALS
-- Content repository used by both CBF tagging and storage
-- ============================================================

CREATE TABLE learning_materials (
    material_id    INT          PRIMARY KEY AUTO_INCREMENT,
    topic_id       INT          NOT NULL,
    uploaded_by    INT          NOT NULL,
    title          VARCHAR(200) NOT NULL,
    description    TEXT         DEFAULT NULL,
    content_type   ENUM('pdf','video','article','exercise','example','summary')
                                NOT NULL,
    file_path      VARCHAR(500) DEFAULT NULL,    -- uploaded files
    external_url   VARCHAR(500) DEFAULT NULL,    -- YouTube / Google Drive links
    difficulty_level ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
    tags           TEXT         DEFAULT NULL,    -- comma-separated; used by CBF
    keywords       TEXT         DEFAULT NULL,    -- TF-IDF input for recommendation engine
    duration_minutes SMALLINT   DEFAULT NULL,    -- estimated read/watch time
    view_count     INT          NOT NULL DEFAULT 0,
    is_remedial    BOOLEAN      NOT NULL DEFAULT FALSE, -- TRUE = remedial-only content
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id)    REFERENCES topics(topic_id)  ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)    ON DELETE RESTRICT
);


-- ============================================================
-- SECTION 6: QUIZ & ASSESSMENT
-- ============================================================

CREATE TABLE quizzes (
    quiz_id            INT          PRIMARY KEY AUTO_INCREMENT,
    topic_id           INT          NOT NULL,
    class_id           INT          DEFAULT NULL,   -- NULL = available to all classes
    created_by         INT          NOT NULL,
    title              VARCHAR(200) NOT NULL,
    description        TEXT         DEFAULT NULL,
    quiz_type          ENUM('diagnostic','formative','summative','remedial')
                                    NOT NULL DEFAULT 'formative',
    total_marks        SMALLINT     NOT NULL,
    passing_threshold  TINYINT      NOT NULL DEFAULT 50,  -- percentage
    time_limit_minutes SMALLINT     DEFAULT NULL,         -- NULL = no limit
    max_attempts       TINYINT      NOT NULL DEFAULT 3,
    shuffle_questions  BOOLEAN      NOT NULL DEFAULT TRUE,
    shuffle_options    BOOLEAN      NOT NULL DEFAULT TRUE,
    available_from     DATETIME     DEFAULT NULL,
    available_until    DATETIME     DEFAULT NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id)   REFERENCES topics(topic_id)  ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(class_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)    ON DELETE RESTRICT
);

CREATE TABLE questions (
    question_id    INT          PRIMARY KEY AUTO_INCREMENT,
    quiz_id        INT          NOT NULL,
    question_text  TEXT         NOT NULL,
    question_type  ENUM('mcq','true_false','short_answer','structural')
                                NOT NULL DEFAULT 'mcq',
    marks          TINYINT      NOT NULL DEFAULT 1,
    difficulty_level ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    topic_tag      VARCHAR(100) DEFAULT NULL,  -- sub-concept tag for CBF (e.g. "matrix_inverse")
    explanation    TEXT         DEFAULT NULL,  -- shown to student after submission
    image_path     VARCHAR(255) DEFAULT NULL,  -- optional diagram/formula image
    sequence_order SMALLINT     NOT NULL DEFAULT 1,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- MCQ answer options
CREATE TABLE question_options (
    option_id      INT     PRIMARY KEY AUTO_INCREMENT,
    question_id    INT     NOT NULL,
    option_text    TEXT    NOT NULL,
    is_correct     BOOLEAN NOT NULL DEFAULT FALSE,
    sequence_order TINYINT NOT NULL DEFAULT 1,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 7: QUIZ ATTEMPTS & STUDENT ANSWERS
-- This is the core adaptive trigger data source
-- ============================================================

CREATE TABLE quiz_attempts (
    attempt_id      INT          PRIMARY KEY AUTO_INCREMENT,
    quiz_id         INT          NOT NULL,
    student_id      INT          NOT NULL,
    attempt_number  TINYINT      NOT NULL DEFAULT 1,
    score           DECIMAL(5,2) NOT NULL DEFAULT 0,
    percentage      DECIMAL(5,2) NOT NULL DEFAULT 0,
    pass_status     ENUM('pass','fail') DEFAULT NULL,  -- set on submission
    started_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at    DATETIME     DEFAULT NULL,
    time_taken_seconds INT       DEFAULT NULL,
    UNIQUE KEY uq_attempt (quiz_id, student_id, attempt_number),
    FOREIGN KEY (quiz_id)    REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id)   ON DELETE CASCADE
);

-- Stores every answer — granular data for identifying weak sub-concepts
CREATE TABLE student_answers (
    answer_id        INT          PRIMARY KEY AUTO_INCREMENT,
    attempt_id       INT          NOT NULL,
    question_id      INT          NOT NULL,
    selected_option_id INT        DEFAULT NULL,  -- MCQ / True-False
    text_answer      TEXT         DEFAULT NULL,  -- Short answer / Structural
    is_correct       BOOLEAN      DEFAULT NULL,
    marks_awarded    DECIMAL(4,2) NOT NULL DEFAULT 0,
    answered_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id)        REFERENCES quiz_attempts(attempt_id)   ON DELETE CASCADE,
    FOREIGN KEY (question_id)       REFERENCES questions(question_id)      ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(option_id) ON DELETE SET NULL
);


-- ============================================================
-- SECTION 8: INTERACTION LOG
-- Fuel for Collaborative Filtering
-- Every material interaction is recorded here
-- ============================================================

CREATE TABLE interaction_logs (
    log_id           INT     PRIMARY KEY AUTO_INCREMENT,
    user_id          INT     NOT NULL,
    material_id      INT     NOT NULL,
    interaction_type ENUM('viewed','downloaded','completed','bookmarked','rated')
                             NOT NULL,
    time_spent_seconds INT   NOT NULL DEFAULT 0,
    rating           TINYINT DEFAULT NULL,  -- 1–5 star rating (optional)
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)              ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES learning_materials(material_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 9: RECOMMENDATION ENGINE
-- ============================================================

-- Tracks per-student per-topic mastery — primary state for adaptive logic
CREATE TABLE student_topic_mastery (
    mastery_id          INT          PRIMARY KEY AUTO_INCREMENT,
    student_id          INT          NOT NULL,
    topic_id            INT          NOT NULL,
    mastery_level       ENUM('not_started','learning','practicing','mastered')
                                     NOT NULL DEFAULT 'not_started',
    mastery_score       DECIMAL(5,2) NOT NULL DEFAULT 0,   -- 0–100 running average
    quiz_attempts_count TINYINT      NOT NULL DEFAULT 0,
    best_score          DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_attempt_at     DATETIME     DEFAULT NULL,
    is_weak             BOOLEAN      NOT NULL DEFAULT FALSE, -- triggers recommendation
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mastery (student_id, topic_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id)  ON DELETE CASCADE,
    FOREIGN KEY (topic_id)   REFERENCES topics(topic_id) ON DELETE CASCADE
);

-- Output table of the Hybrid Recommendation Engine
CREATE TABLE recommendations (
    recommendation_id    INT          PRIMARY KEY AUTO_INCREMENT,
    user_id              INT          NOT NULL,
    material_id          INT          NOT NULL,
    triggered_by_attempt INT          DEFAULT NULL,   -- quiz_attempts.attempt_id
    algorithm_used       ENUM('content_based','collaborative','hybrid','cold_start')
                                      NOT NULL,
    reason               VARCHAR(255) DEFAULT NULL,   -- human-readable explanation
    confidence_score     FLOAT        DEFAULT NULL,
    is_accepted          BOOLEAN      DEFAULT NULL,   -- NULL = not yet responded
    is_dismissed         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at         DATETIME     DEFAULT NULL,
    CONSTRAINT chk_confidence CHECK (confidence_score IS NULL
                                     OR (confidence_score BETWEEN 0 AND 1)),
    FOREIGN KEY (user_id)              REFERENCES users(user_id)                 ON DELETE CASCADE,
    FOREIGN KEY (material_id)          REFERENCES learning_materials(material_id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by_attempt) REFERENCES quiz_attempts(attempt_id)      ON DELETE SET NULL
);

-- Stores TF-IDF / cosine-similarity scores between materials (pre-computed)
-- Populated by the Python recommendation microservice
CREATE TABLE material_similarity (
    id             INT   PRIMARY KEY AUTO_INCREMENT,
    material_a_id  INT   NOT NULL,
    material_b_id  INT   NOT NULL,
    similarity_score FLOAT NOT NULL,
    computed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_similarity (material_a_id, material_b_id),
    FOREIGN KEY (material_a_id) REFERENCES learning_materials(material_id) ON DELETE CASCADE,
    FOREIGN KEY (material_b_id) REFERENCES learning_materials(material_id) ON DELETE CASCADE
);

-- Collaborative Filtering: user-item interaction matrix cache
CREATE TABLE user_item_matrix (
    id            INT   PRIMARY KEY AUTO_INCREMENT,
    student_id    INT   NOT NULL,
    material_id   INT   NOT NULL,
    implicit_score FLOAT NOT NULL DEFAULT 0,  -- derived from interaction_logs
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_item (student_id, material_id),
    FOREIGN KEY (student_id)  REFERENCES users(user_id)                  ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES learning_materials(material_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 10: ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================

CREATE TABLE announcements (
    announcement_id INT          PRIMARY KEY AUTO_INCREMENT,
    class_id        INT          DEFAULT NULL,  -- NULL = system-wide
    posted_by       INT          NOT NULL,
    title           VARCHAR(200) NOT NULL,
    content         TEXT         NOT NULL,
    is_pinned       BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at      DATETIME     DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)  REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES users(user_id)    ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT          PRIMARY KEY AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    type            ENUM('recommendation','quiz_available','quiz_result',
                         'announcement','achievement','reminder') NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT         NOT NULL,
    reference_id    INT          DEFAULT NULL,   -- ID of the related entity
    reference_type  VARCHAR(50)  DEFAULT NULL,   -- 'quiz', 'recommendation', etc.
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 11: ACHIEVEMENTS / GAMIFICATION
-- ============================================================

CREATE TABLE achievements (
    achievement_id INT          PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL UNIQUE,
    description    TEXT         DEFAULT NULL,
    badge_icon     VARCHAR(255) DEFAULT NULL,
    criteria_type  ENUM('quiz_pass_streak','topic_mastered','materials_viewed',
                        'score_improvement','quiz_perfect') NOT NULL,
    criteria_value INT          NOT NULL,   -- e.g. pass 5 quizzes in a row = 5
    points         SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE student_achievements (
    id             INT       PRIMARY KEY AUTO_INCREMENT,
    student_id     INT       NOT NULL,
    achievement_id INT       NOT NULL,
    earned_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_achievement (student_id, achievement_id),
    FOREIGN KEY (student_id)    REFERENCES users(user_id)        ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
);


-- ============================================================
-- SECTION 12: PERFORMANCE INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_email   ON users(email);

-- Topics
CREATE INDEX idx_topics_course    ON topics(course_id);
CREATE INDEX idx_topics_sequence  ON topics(course_id, sequence_order);

-- Materials
CREATE INDEX idx_materials_topic      ON learning_materials(topic_id);
CREATE INDEX idx_materials_difficulty ON learning_materials(difficulty_level);
CREATE INDEX idx_materials_remedial   ON learning_materials(is_remedial);
CREATE INDEX idx_materials_type       ON learning_materials(content_type);

-- Quizzes
CREATE INDEX idx_quizzes_topic   ON quizzes(topic_id);
CREATE INDEX idx_quizzes_type    ON quizzes(quiz_type);

-- Attempts
CREATE INDEX idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_attempts_quiz    ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_status  ON quiz_attempts(pass_status);

-- Answers (most frequently queried for recommendation engine)
CREATE INDEX idx_answers_attempt  ON student_answers(attempt_id);
CREATE INDEX idx_answers_correct  ON student_answers(is_correct);

-- Interaction Logs (CF matrix source)
CREATE INDEX idx_logs_user      ON interaction_logs(user_id);
CREATE INDEX idx_logs_material  ON interaction_logs(material_id);
CREATE INDEX idx_logs_type      ON interaction_logs(interaction_type);

-- Recommendations
CREATE INDEX idx_recs_user      ON recommendations(user_id);
CREATE INDEX idx_recs_algo      ON recommendations(algorithm_used);
CREATE INDEX idx_recs_accepted  ON recommendations(is_accepted);

-- Mastery (most read table for adaptive logic)
CREATE INDEX idx_mastery_student ON student_topic_mastery(student_id);
CREATE INDEX idx_mastery_weak    ON student_topic_mastery(student_id, is_weak);

-- Notifications
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);

-- Enrollments
CREATE INDEX idx_enroll_class   ON class_enrollments(class_id);
CREATE INDEX idx_enroll_student ON class_enrollments(student_id);


-- ============================================================
-- SECTION 13: SEED DATA — Linear Algebra Course
-- ============================================================

-- Course
INSERT INTO courses (course_code, course_name, description, credit_hours) VALUES
('MAT423', 'Linear Algebra',
 'Introductory Linear Algebra course covering Matrices, Systems of Linear Equations, and Determinants for first-year Computer Science students.',
 3);

-- Topics (Chapter hierarchy)
INSERT INTO topics (course_id, parent_topic_id, topic_name, description, sequence_order, difficulty_level, estimated_hours) VALUES
-- Chapter 1: Matrices
(1, NULL, 'Chapter 1: Matrices',            'Introduction to matrices and matrix operations.',                         1, 'basic',        6.0),
(1, 1,    'Introduction to Matrices',       'Definition, notation, types of matrices (square, identity, zero).',       1, 'basic',        1.0),
(1, 1,    'Matrix Operations',              'Addition, subtraction and scalar multiplication of matrices.',             2, 'basic',        1.5),
(1, 1,    'Matrix Multiplication',          'Row-by-column multiplication, properties of matrix multiplication.',       3, 'intermediate', 2.0),
(1, 1,    'Transpose of a Matrix',          'Definition and properties of transpose.',                                  4, 'basic',        0.5),
(1, 1,    'Inverse of a Matrix',            'Conditions for invertibility; finding the inverse using row reduction.',   5, 'intermediate', 1.0),
-- Chapter 2: Systems of Linear Equations
(1, NULL, 'Chapter 2: System of Linear Equations', 'Solving systems using matrix methods.',                            2, 'intermediate', 7.0),
(1, 7,    'Row Reduction & Echelon Forms',  'Row operations, row echelon form, reduced row echelon form.',              1, 'intermediate', 2.0),
(1, 7,    'Gaussian Elimination',           'Forward elimination to solve linear systems.',                             2, 'intermediate', 2.5),
(1, 7,    'Gauss-Jordan Elimination',       'Full row reduction to find unique, infinite, or no solutions.',            3, 'advanced',     2.5),
-- Chapter 3: Determinants
(1, NULL, 'Chapter 3: Determinants',        'Computing and applying determinants of square matrices.',                  3, 'intermediate', 5.0),
(1, 11,   'Definition of Determinants',     'Determinant of 2×2 and 3×3 matrices.',                                    1, 'basic',        1.0),
(1, 11,   'Properties of Determinants',     'Row operations and their effect on determinants.',                         2, 'intermediate', 1.5),
(1, 11,   'Cofactor Expansion',             'Expanding along rows or columns; minors and cofactors.',                   3, 'intermediate', 1.5),
(1, 11,   "Cramer's Rule",                  'Using determinants to solve square linear systems.',                        4, 'advanced',     1.0);

-- Prerequisite chains
INSERT INTO topic_prerequisites (topic_id, required_topic_id) VALUES
(4,  3),   -- Matrix Multiplication requires Matrix Operations
(6,  4),   -- Inverse requires Matrix Multiplication
(8,  2),   -- Row Reduction requires Intro to Matrices
(9,  8),   -- Gaussian Elimination requires Row Reduction
(10, 9),   -- Gauss-Jordan requires Gaussian Elimination
(12, 2),   -- Determinant definition requires Intro to Matrices
(13, 12),  -- Properties require Determinant definition
(14, 13),  -- Cofactor requires Properties
(15, 14);  -- Cramer's Rule requires Cofactor Expansion

-- Default achievements
INSERT INTO achievements (name, description, badge_icon, criteria_type, criteria_value, points) VALUES
('First Step',       'Attempt your first quiz.',                                   'badge_first.png',    'quiz_pass_streak',   1,  10),
('On a Roll',        'Pass 3 quizzes in a row.',                                   'badge_streak3.png',  'quiz_pass_streak',   3,  30),
('Unstoppable',      'Pass 5 quizzes in a row.',                                   'badge_streak5.png',  'quiz_pass_streak',   5,  75),
('Matrix Master',    'Achieve mastery in all Matrices sub-topics.',                 'badge_matrix.png',   'topic_mastered',     6,  100),
('Perfect Score',    'Score 100% on any quiz.',                                    'badge_perfect.png',  'quiz_perfect',       1,  50),
('Bookworm',         'View 10 learning materials.',                                 'badge_book.png',     'materials_viewed',   10, 25),
('Rising Star',      'Improve your quiz score by 20+ points on a re-attempt.',     'badge_rise.png',     'score_improvement',  20, 40);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
