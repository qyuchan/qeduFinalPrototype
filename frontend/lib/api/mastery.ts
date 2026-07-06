import { api } from './client'

export interface MasteryRecord {
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
  total_sets: number
  topic: {
    topic_id: number
    topic_name: string
    difficulty_level: string
    sequence_order: number
  } | null
}

// Short TTL cache - mastery updates after quiz submission
let _cache: { data: MasteryRecord[]; expires: number } | null = null
const TTL = 60_000 // 60 seconds

export const masteryApi = {
  getAll: async (): Promise<MasteryRecord[]> => {
    const now = Date.now()
    if (_cache && now < _cache.expires) return _cache.data
    const data = await api.get<MasteryRecord[]>('/mastery')
    _cache = { data, expires: now + TTL }
    return data
  },

  invalidate: () => { _cache = null },
}
