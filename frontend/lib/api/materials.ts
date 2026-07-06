import { api } from './client'

export interface Material {
  material_id: number
  topic_id: number
  title: string
  content_type: 'pdf' | 'video' | 'article' | 'exercise' | 'example' | 'summary'
  difficulty_level: string
  external_url: string | null
  duration_minutes: number | null
  description: string | null
  view_count: number
}

export const materialsApi = {
  getByTopic: (topicId: number) => api.get<Material[]>(`/topics/${topicId}/materials`),
  logView:    (id: number)      => api.post<{ status: string }>(`/materials/${id}/interact`, { interaction_type: 'viewed' }),
}
