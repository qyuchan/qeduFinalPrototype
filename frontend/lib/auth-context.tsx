"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, type User } from '@/lib/api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (login: string, password: string) => Promise<User>
  register: (data: Record<string, string>) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setLoading(false)
  }, [])
  const [error,   setError]   = useState<string | null>(null)

  const login = useCallback(async (login: string, password: string) => {
    setLoading(true); setError(null)
    try {
      const data = await authApi.login(login, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (e: any) {
      const msg = e?.data?.message || 'Invalid credentials'
      setError(msg); throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: Record<string, string>) => {
    setLoading(true); setError(null)
    try {
      const data = await authApi.register(payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (e: any) {
      const msg = e?.data?.message || 'Registration failed'
      setError(msg); throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
