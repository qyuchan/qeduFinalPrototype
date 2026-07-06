const API_BASE = '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err })
  }

  return res.json()
}

async function requestForm<T>(method: string, path: string, body: FormData): Promise<T> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err })
  }

  return res.json()
}

export const api = {
  get:      <T>(path: string)                    => request<T>('GET',    path),
  post:     <T>(path: string, body: unknown)     => request<T>('POST',   path, body),
  postForm: <T>(path: string, body: FormData)    => requestForm<T>('POST', path, body),
  patch:    <T>(path: string, body?: unknown)    => request<T>('PATCH',  path, body),
  delete:   <T>(path: string)                    => request<T>('DELETE', path),
}
