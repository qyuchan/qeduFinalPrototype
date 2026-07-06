import { api } from './client'

export interface QuizQuestion {
  question_id: number
  question_text: string
  difficulty_level: string
  topic_tag: string | null
  image_path: string | null
  options: { option_id: number; option_text: string; sequence_order: number }[]
}

export interface Quiz {
  quiz_id: number
  topic_id: number
  title: string
  quiz_type: string
  total_marks: number
  passing_threshold: number
  time_limit_minutes: number | null
  questions: QuizQuestion[]
}

export interface QuizResult {
  attempt_id: number
  score: number
  percentage: number
  pass_status: 'pass' | 'fail'
  student_answers: {
    answer_id: number
    is_correct: boolean
    marks_awarded: number
    question: {
      question_text: string
      explanation: string | null
      topic_tag: string | null
    }
  }[]
  recommendations: {
    recommendation_id:   number
    algorithm_used:      string
    recommendation_type: string
    confidence_score:    number | null
    reason:              string | null
    material: {
      material_id:      number
      title:            string
      content_type:     string
      external_url:     string | null
      duration_minutes: number | null
    } | null
  }[]
}

export const quizApi = {
  availableSets: (topicId: number)                      => api.get<number[]>(`/topics/${topicId}/sets`),
  fetch:         (topicId: number, set?: number)        => api.get<Quiz>(`/topics/${topicId}/quiz${set ? `?set=${set}` : ''}`),
  submit:    (quizId: number, answers: Record<number, number>) =>
    api.post<{ attempt_id: number; percentage: number; pass_status: string; is_weak: boolean }>(
      `/quiz/${quizId}/submit`, { answers }
    ),
  getResult: (attemptId: number) => api.get<QuizResult>(`/quiz/attempt/${attemptId}/result`),
  uploadWork: (attemptId: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.postForm<{ upload_id: number; url: string; original_name: string }>(
      `/quiz/attempt/${attemptId}/upload`, fd
    )
  },
}
