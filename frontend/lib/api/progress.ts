import { api } from './client'

export const progressApi = {
  getCompleted:    ()                                    => api.get<string[]>('/subtopic-progress'),
  markComplete:    (subtopicId: string, topicId: number) =>
    api.post<{ status: string }>('/subtopic-progress', { subtopic_id: subtopicId, topic_id: topicId }),
  markIncomplete:  (subtopicId: string)                  =>
    api.delete<{ status: string }>(`/subtopic-progress/${encodeURIComponent(subtopicId)}`),
}
