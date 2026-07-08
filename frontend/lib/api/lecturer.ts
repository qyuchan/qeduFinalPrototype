import { api } from './client'

export interface Topic {
  topic_id: number
  topic_name: string
  difficulty_level: string
  description: string | null
  syllabus: string | null
  sequence_order: number
  estimated_hours: number | null
}

export interface TopicPayload {
  topic_name: string
  description?: string
  syllabus?: string
  difficulty_level: string
  sequence_order: number
  estimated_hours?: number
}

export interface Subtopic {
  topic_id: number
  topic_name: string
  description: string | null
  syllabus: string | null
  slide_file_path: string | null
  sequence_order: number
}

export interface SubtopicPayload {
  topic_name: string
  description?: string
  syllabus?: string
  sequence_order: number
}

export interface ClassRoom {
  class_id: number
  course_id: number
  lecturer_id: number
  class_name: string
  semester: '1' | '2' | 'short'
  academic_year: string
  enrollment_limit: number
  is_active: boolean
  student_count?: number
  course?: { course_code: string; course_name: string }
}

export interface EnrolledStudent {
  enrollment_id: number
  user_id: number
  full_name: string
  student_id: string | null
  email: string
  enrolled_at: string
}

export interface StudentSearchResult {
  user_id: number
  full_name: string
  email: string
  student_id: string | null
}

export interface Material {
  material_id: number
  topic_id: number
  topic?: Topic
  title: string
  description: string | null
  content_type: string
  external_url: string | null
  file_url: string | null
  difficulty_level: string
  tags: string | null
  keywords: string | null
  subtopic_id: string | null
  duration_minutes: number | null
  is_remedial: boolean
  is_active: boolean
  view_count: number
}

export interface CreateMaterialPayload {
  topic_id: number
  title: string
  description?: string
  content_type: string
  external_url?: string
  difficulty_level: string
  tags?: string
  keywords?: string
  subtopic_id?: string
  duration_minutes?: number
  is_remedial?: boolean
}

export interface QuizOption {
  option_id?: number
  option_text: string
  is_correct: boolean
}

export interface QuizQuestion {
  question_id?: number
  question_text: string
  marks: number
  difficulty_level: string
  topic_tag?: string
  subtopic_id?: string | null
  explanation?: string
  image_path?: string | null
  options: QuizOption[]
}

export interface UpdateQuizQuestion {
  question_id?: number
  question_text: string
  marks: number
  difficulty_level: string
  topic_tag?: string
  subtopic_id?: string | null
  explanation?: string
  options: QuizOption[]
}

export interface UpdateQuizPayload {
  topic_id: number
  class_id?: number
  title: string
  description?: string
  quiz_type: string
  passing_threshold: number
  time_limit_minutes?: number
  questions: UpdateQuizQuestion[]
}

export interface CreateQuizPayload {
  topic_id: number
  class_id?: number
  title: string
  description?: string
  quiz_type: string
  passing_threshold: number
  time_limit_minutes?: number
  questions: QuizQuestion[]
}

export interface Quiz {
  quiz_id: number
  topic_id: number
  class_id: number | null
  topic?: Topic
  title: string
  description: string | null
  quiz_type: string
  total_marks: number
  passing_threshold: number
  time_limit_minutes: number | null
  is_active: boolean
  questions_count?: number
  questions?: QuizQuestion[]
}

export interface StudentMastery {
  mastery_level: string
  mastery_score: number
  is_weak: boolean
}

export interface StudentMasteryRecord {
  mastery_id: number
  student_id: number
  topic_id: number
  mastery_level: 'not_started' | 'learning' | 'practicing' | 'mastered'
  mastery_score: number
  quiz_attempts_count: number
  best_score: number
  last_attempt_at: string | null
  is_weak: boolean
  courses_completed: number
  attempted_set_numbers: number[]
  topic: {
    topic_id: number
    topic_name: string
    difficulty_level: string
    sequence_order: number
    description: string | null
  } | null
}

export interface StudentOverview {
  user_id: number
  full_name: string
  student_id: string | null
  masteries: Record<number, StudentMastery>
}

export interface MasteryOverview {
  topics: Topic[]
  students: StudentOverview[]
}

export interface Remediation {
  remediation_id: number
  question_id: number
  lecturer_id: number
  material_id: number | null
  custom_explanation: string | null
  created_at: string
  lecturer: { user_id: number; full_name: string }
  material: {
    material_id: number
    title: string
    content_type: string
    file_url: string | null
    external_url: string | null
    duration_minutes: number | null
  } | null
}

export interface AttemptUpload {
  upload_id: number
  attempt_id: number
  student_id: number
  original_name: string
  mime_type: string
  file_size: number
  uploaded_at: string
  url: string
}

export interface AttemptReview {
  review_id: number
  attempt_id: number
  lecturer_id: number
  comment: string | null
  original_name: string | null
  mime_type: string | null
  file_size: number | null
  file_url: string | null
  created_at: string
  updated_at: string
  student_completed_at: string | null
  lecturer: { user_id: number; full_name: string } | null
}

export interface StudentAttempt {
  attempt_id: number
  quiz_id: number
  score: number
  percentage: number
  pass_status: 'pass' | 'fail'
  submitted_at: string
  quiz: {
    quiz_id: number
    title: string
    topic_id: number
    set_number: number | null
    quiz_type: string
    topic: { topic_id: number; topic_name: string } | null
  } | null
  uploads: AttemptUpload[]
  reviews: AttemptReview[]
}

export interface WrongAnswerOption {
  option_id: number
  option_text: string
  is_correct: boolean
  sequence_order: number
}

export interface WrongAnswer {
  answer_id: number
  question_id: number
  selected_option_id: number | null
  question_text: string
  difficulty_level: string
  topic_tag: string | null
  options: WrongAnswerOption[]
}

export interface FlaggedQuestionOption {
  option_id: number
  option_text: string
  is_correct: boolean
}

export interface FlaggedQuestion {
  question_id: number
  quiz_id: number
  topic_id: number
  question_text: string
  difficulty_level: string
  topic_tag: string | null
  wrong_count: number
  affected_students: number
  options: FlaggedQuestionOption[]
  remediations: Remediation[]
}

// ── Cache store ───────────────────────────────────────────────────────────────

interface CacheEntry<T> { data: T; expires: number }

const CLASSES_TTL    = 5  * 60_000
const MATERIALS_TTL  = 5  * 60_000
const QUIZZES_TTL    = 5  * 60_000
const FLAGGED_TTL    = 10 * 60_000
const MASTERY_TTL    = 2  * 60_000
const TOPICS_TTL     = 5  * 60_000
const SUBTOPICS_TTL  = 5  * 60_000

let _classes:   CacheEntry<ClassRoom[]>      | null = null
let _materials: CacheEntry<Material[]>        | null = null
let _quizzes:   CacheEntry<Quiz[]>            | null = null
let _flagged:   CacheEntry<FlaggedQuestion[]> | null = null
let _topics:    CacheEntry<Topic[]>           | null = null
const _mastery    = new Map<string, CacheEntry<MasteryOverview>>()
const _subtopics  = new Map<number, CacheEntry<Subtopic[]>>()

function hit<T>(c: CacheEntry<T> | null | undefined): T | null {
  if (!c || Date.now() >= c.expires) return null
  return c.data
}

// ── API ───────────────────────────────────────────────────────────────────────

export const lecturerApi = {
  // Topics - 5-min cache, invalidated on any mutation
  topics: async (): Promise<Topic[]> => {
    const cached = hit(_topics)
    if (cached) return cached
    const data = await api.get<Topic[]>('/lecturer/topics')
    _topics = { data, expires: Date.now() + TOPICS_TTL }
    return data
  },
  createTopic: async (data: TopicPayload): Promise<Topic> => {
    const result = await api.post<Topic>('/lecturer/topics', data)
    _topics = null
    return result
  },
  updateTopic: async (id: number, data: Partial<TopicPayload>): Promise<Topic> => {
    const result = await api.patch<Topic>(`/lecturer/topics/${id}`, data)
    _topics = null
    return result
  },
  deleteTopic: async (id: number, permanent = false): Promise<{ message: string }> => {
    const url = permanent ? `/lecturer/topics/${id}?permanent=true` : `/lecturer/topics/${id}`
    const result = await api.delete<{ message: string }>(url)
    _topics = null
    return result
  },
  hiddenTopics: async (): Promise<Topic[]> => {
    return api.get<Topic[]>('/lecturer/topics/hidden')
  },
  restoreTopic: async (id: number): Promise<Topic> => {
    const result = await api.patch<Topic>(`/lecturer/topics/${id}/restore`, {})
    _topics = null
    return result
  },

  // Subtopics - per-parent cache
  topicSubtopics: async (topicId: number): Promise<Subtopic[]> => {
    const cached = hit(_subtopics.get(topicId))
    if (cached) return cached
    const data = await api.get<Subtopic[]>(`/lecturer/topics/${topicId}/subtopics`)
    _subtopics.set(topicId, { data, expires: Date.now() + SUBTOPICS_TTL })
    return data
  },
  createSubtopic: async (topicId: number, data: SubtopicPayload): Promise<Subtopic> => {
    const result = await api.post<Subtopic>(`/lecturer/topics/${topicId}/subtopics`, data)
    _subtopics.delete(topicId)
    return result
  },
  updateSubtopic: async (topicId: number, subtopicId: number, data: Partial<SubtopicPayload>): Promise<Subtopic> => {
    const result = await api.patch<Subtopic>(`/lecturer/topics/${topicId}/subtopics/${subtopicId}`, data)
    _subtopics.delete(topicId)
    return result
  },
  deleteSubtopic: async (topicId: number, subtopicId: number, permanent = false): Promise<{ message: string }> => {
    const url = permanent
      ? `/lecturer/topics/${topicId}/subtopics/${subtopicId}?permanent=true`
      : `/lecturer/topics/${topicId}/subtopics/${subtopicId}`
    const result = await api.delete<{ message: string }>(url)
    _subtopics.delete(topicId)
    return result
  },
  hiddenSubtopics: async (topicId: number): Promise<Subtopic[]> => {
    return api.get<Subtopic[]>(`/lecturer/topics/${topicId}/subtopics/hidden`)
  },
  restoreSubtopic: async (topicId: number, subtopicId: number): Promise<Subtopic> => {
    const result = await api.patch<Subtopic>(`/lecturer/topics/${topicId}/subtopics/${subtopicId}/restore`, {})
    _subtopics.delete(topicId)
    return result
  },
  uploadSubtopicSlide: async (topicId: number, subtopicId: number, file: File): Promise<{ slide_file_path: string; slide_url: string }> => {
    const form = new FormData()
    form.append('slide', file)
    const result = await api.postForm<{ slide_file_path: string; slide_url: string }>(
      `/lecturer/topics/${topicId}/subtopics/${subtopicId}/slide`, form
    )
    _subtopics.delete(topicId)
    return result
  },
  deleteSubtopicSlide: async (topicId: number, subtopicId: number): Promise<{ message: string }> => {
    const result = await api.delete<{ message: string }>(`/lecturer/topics/${topicId}/subtopics/${subtopicId}/slide`)
    _subtopics.delete(topicId)
    return result
  },
  uploadQuestionFigure: async (questionId: number, file: File): Promise<{ image_path: string; image_url: string }> => {
    const form = new FormData()
    form.append('figure', file)
    return api.postForm<{ image_path: string; image_url: string }>(`/lecturer/questions/${questionId}/figure`, form)
  },

  // Classes - 5-min cache, invalidated on any mutation
  classes: async (): Promise<ClassRoom[]> => {
    const cached = hit(_classes)
    if (cached) return cached
    const data = await api.get<ClassRoom[]>('/lecturer/classes')
    _classes = { data, expires: Date.now() + CLASSES_TTL }
    return data
  },
  createClass: async (data: { class_name: string; semester: string; academic_year: string; enrollment_limit?: number }): Promise<ClassRoom> => {
    const result = await api.post<ClassRoom>('/lecturer/classes', data)
    _classes = null
    return result
  },
  updateClass: async (id: number, data: Partial<{ class_name: string; semester: string; academic_year: string; enrollment_limit: number; is_active: boolean }>): Promise<ClassRoom> => {
    const result = await api.patch<ClassRoom>(`/lecturer/classes/${id}`, data)
    _classes = null
    return result
  },
  deleteClass: async (id: number): Promise<{ message: string }> => {
    const result = await api.delete<{ message: string }>(`/lecturer/classes/${id}`)
    _classes = null
    return result
  },

  // Enrollment - no caching (per-class detail, small payload)
  classStudents:  (classId: number) => api.get<EnrolledStudent[]>(`/lecturer/classes/${classId}/students`),
  enrollStudent:  (classId: number, userId: number) =>
    api.post<EnrolledStudent>(`/lecturer/classes/${classId}/students`, { user_id: userId }),
  unenrollStudent:(classId: number, userId: number) =>
    api.delete<{ message: string }>(`/lecturer/classes/${classId}/students/${userId}`),
  searchStudents:  (q: string) => api.get<StudentSearchResult[]>(`/lecturer/students/search?q=${encodeURIComponent(q)}`),
  studentMastery:         (studentId: number) => api.get<StudentMasteryRecord[]>(`/lecturer/students/${studentId}/mastery`),
  studentAttempts:        (studentId: number) => api.get<StudentAttempt[]>(`/lecturer/students/${studentId}/attempts`),
  attemptWrongQuestions:  (studentId: number, attemptId: number) =>
    api.get<WrongAnswer[]>(`/lecturer/students/${studentId}/attempts/${attemptId}/wrong-questions`),
  storeReview: (attemptId: number, comment: string, file?: File | null) => {
    const fd = new FormData()
    if (comment) fd.append('comment', comment)
    if (file) fd.append('file', file)
    return api.postForm<AttemptReview>(`/lecturer/attempts/${attemptId}/review`, fd)
  },

  // Mastery overview - 2-min cache keyed by class_id
  masteryOverview: async (classId?: number): Promise<MasteryOverview> => {
    const key = classId ? String(classId) : 'all'
    const cached = hit(_mastery.get(key))
    if (cached) return cached
    const data = await api.get<MasteryOverview>(`/lecturer/mastery-overview${classId ? `?class_id=${classId}` : ''}`)
    _mastery.set(key, { data, expires: Date.now() + MASTERY_TTL })
    return data
  },
  invalidateMastery: () => _mastery.clear(),

  // Materials - 5-min cache, invalidated on any mutation
  materials: async (): Promise<Material[]> => {
    const cached = hit(_materials)
    if (cached) return cached
    const data = await api.get<Material[]>('/lecturer/materials')
    _materials = { data, expires: Date.now() + MATERIALS_TTL }
    return data
  },
  createMaterial: async (data: CreateMaterialPayload, file?: File): Promise<Material> => {
    let result: Material
    if (file) {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(data).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        // Laravel's `boolean` validation rule only accepts true/false/0/1/'0'/'1' —
        // not the string "true"/"false" that FormData would otherwise stringify to.
        fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
      })
      result = await api.postForm<Material>('/lecturer/materials', fd)
    } else {
      result = await api.post<Material>('/lecturer/materials', data)
    }
    _materials = null
    return result
  },
  updateMaterial: async (id: number, data: Partial<CreateMaterialPayload>): Promise<Material> => {
    const result = await api.patch<Material>(`/lecturer/materials/${id}`, data)
    _materials = null
    return result
  },
  deleteMaterial: async (id: number): Promise<{ message: string }> => {
    const result = await api.delete<{ message: string }>(`/lecturer/materials/${id}`)
    _materials = null
    return result
  },

  // Quizzes - 5-min cache, invalidated on any mutation
  quizzes: async (): Promise<Quiz[]> => {
    const cached = hit(_quizzes)
    if (cached) return cached
    const data = await api.get<Quiz[]>('/lecturer/quizzes')
    _quizzes = { data, expires: Date.now() + QUIZZES_TTL }
    return data
  },
  createQuiz: async (data: CreateQuizPayload): Promise<Quiz> => {
    const result = await api.post<Quiz>('/lecturer/quizzes', data)
    _quizzes = null
    return result
  },
  updateQuiz: async (id: number, data: UpdateQuizPayload): Promise<Quiz & { has_attempts: boolean }> => {
    const result = await api.patch<Quiz & { has_attempts: boolean }>(`/lecturer/quizzes/${id}`, data)
    _quizzes = null
    return result
  },
  showQuiz:   (id: number) => api.get<Quiz & { questions: QuizQuestion[] }>(`/lecturer/quizzes/${id}`),
  deleteQuiz: async (id: number): Promise<{ message: string }> => {
    const result = await api.delete<{ message: string }>(`/lecturer/quizzes/${id}`)
    _quizzes = null
    return result
  },
  questionTags: (): Promise<string[]> => api.get<string[]>('/lecturer/question-tags'),
  deleteQuestionFigure: (questionId: number): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/lecturer/questions/${questionId}/figure`),

  // Flagged questions - 10-min cache, invalidated when remediations change
  flaggedQuestions: async (): Promise<FlaggedQuestion[]> => {
    const cached = hit(_flagged)
    if (cached) return cached
    const data = await api.get<FlaggedQuestion[]>('/lecturer/flagged-questions')
    _flagged = { data, expires: Date.now() + FLAGGED_TTL }
    return data
  },
  addRemediation: async (questionId: number, data: { material_id?: number; custom_explanation?: string }): Promise<Remediation> => {
    const result = await api.post<Remediation>(`/lecturer/questions/${questionId}/remediations`, data)
    _flagged = null
    return result
  },
  deleteRemediation: async (id: number): Promise<{ message: string }> => {
    const result = await api.delete<{ message: string }>(`/lecturer/remediations/${id}`)
    _flagged = null
    return result
  },
  dismissFlaggedQuestion: async (questionId: number): Promise<{ message: string }> => {
    const result = await api.post<{ message: string }>(`/lecturer/flagged-questions/${questionId}/dismiss`, {})
    _flagged = null
    return result
  },
}
