import { api } from './client'

export interface User {
  user_id: number
  student_id: string | null
  full_name: string
  username: string
  email: string
  role: 'student' | 'lecturer' | 'admin'
  is_active: boolean
  student_profile?: { streak_days: number; overall_performance_score: number } | null
}

export const authApi = {
  login:    (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  register: (data: Record<string, string>) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  logout:   () => api.post<void>('/auth/logout', {}),
  me:       () => api.get<{ user: User; student_profile: unknown }>('/auth/me'),
}
