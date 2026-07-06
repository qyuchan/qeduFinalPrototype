import { api } from './client'

export interface RecommendationRecord {
  recommendation_id:   number
  user_id:             number
  material_id:         number | null
  algorithm_used:      'content_based' | 'collaborative' | 'hybrid' | 'cold_start'
  recommendation_type: 'study_material' | 'course_navigation'
  subtopic_id:         string | null
  reason:              string | null
  confidence_score:    number | null
  is_accepted:         boolean | null
  is_dismissed:        boolean
  material: {
    material_id:      number
    title:            string
    content_type:     'pdf' | 'video' | 'article' | 'exercise' | 'example' | 'summary'
    external_url:     string | null
    duration_minutes: number | null
    difficulty_level: string
  } | null
}

export interface LecturerRemediation {
  remediation_id: number
  question_id: number
  lecturer_id: number
  material_id: number | null
  custom_explanation: string | null
  created_at: string
  attempt_id: number | null
  lecturer: { user_id: number; full_name: string }
  material: {
    material_id: number
    title: string
    content_type: string
    external_url: string | null
    file_url: string | null
    duration_minutes: number | null
  } | null
  question: {
    question_id: number
    question_text: string
    topic_tag: string | null
  } | null
}

export interface AttemptDetail {
  attempt_id: number
  quiz_id: number
  score: number
  percentage: number
  pass_status: 'pass' | 'fail'
  submitted_at: string
  quiz: {
    quiz_id: number
    title: string
    set_number: number | null
    topic: { topic_id: number; topic_name: string } | null
  } | null
  student_answers: {
    answer_id: number
    question_id: number
    selected_option_id: number | null
    is_correct: boolean
    marks_awarded: number
    question: {
      question_id: number
      question_text: string
      marks: number
      topic_tag: string | null
      options: {
        option_id: number
        option_text: string
        is_correct: boolean
      }[]
      remediations: {
        remediation_id: number
        custom_explanation: string | null
        lecturer: { user_id: number; full_name: string } | null
        material: {
          material_id: number
          title: string
          content_type: string
          file_url: string | null
          external_url: string | null
        } | null
      }[]
    } | null
  }[]
  reviews: {
    review_id: number
    comment: string | null
    file_url: string | null
    original_name: string | null
    updated_at: string
    lecturer: { user_id: number; full_name: string } | null
  }[]
  uploads: {
    upload_id: number
    original_name: string
    mime_type: string
    url: string
  }[]
}

export interface LecturerReview {
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
  lecturer: { user_id: number; full_name: string } | null
  attempt: {
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
  } | null
}

export const recommendationsApi = {
  getAll:               () => api.get<RecommendationRecord[]>('/recommendations'),
  accept:               (id: number) => api.patch<void>(`/recommendations/${id}/accept`),
  dismiss:              (id: number) => api.patch<void>(`/recommendations/${id}/dismiss`),
  lecturerRemediations: () => api.get<LecturerRemediation[]>('/lecturer-remediations'),
  dismissRemediation:   (id: number) => api.post<void>(`/lecturer-remediations/${id}/dismiss`, {}),
  lecturerReviews:      () => api.get<LecturerReview[]>('/lecturer-reviews'),
  completeReview:       (reviewId: number) => api.patch<void>(`/reviews/${reviewId}/complete`),
  getAttemptDetail:     (attemptId: number) => api.get<AttemptDetail>(`/quiz/attempt/${attemptId}/result`),
  logInteraction: (materialId: number, type: 'viewed' | 'downloaded' | 'completed' | 'bookmarked') =>
    api.post<void>(`/materials/${materialId}/interact`, { interaction_type: type }).catch(() => {}),
}
