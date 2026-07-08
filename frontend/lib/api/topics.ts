import { api } from './client'

export interface Topic {
  topic_id: number
  topic_name: string
  difficulty_level: string
  description: string | null
  syllabus: string | null
  sequence_order: number
}

export interface Subtopic {
  topic_id: number
  topic_name: string
  description: string | null
  syllabus: string | null
  slide_file_path: string | null
  slide_url: string | null
  sequence_order: number
}

// Topics are static course structure - cache for the session
let _cache: Topic[] | null = null
const _subtopicCache = new Map<number, Subtopic[]>()

export const topicsApi = {
  getAll: async (): Promise<Topic[]> => {
    if (_cache) return _cache
    const data = await api.get<Topic[]>('/topics')
    _cache = data
    return data
  },
  getSubtopics: async (topicId: number): Promise<Subtopic[]> => {
    if (_subtopicCache.has(topicId)) return _subtopicCache.get(topicId)!
    const data = await api.get<Subtopic[]>(`/topics/${topicId}/subtopics`)
    _subtopicCache.set(topicId, data)
    return data
  },
  invalidate: () => {
    _cache = null
    _subtopicCache.clear()
  },
}
