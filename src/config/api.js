/**
 * API Configuration
 * - Mock mode: uses localStorage and in-memory data (no backend needed)
 * - Real mode: connects to Flask backend API
 *
 * Switch mode via VITE_AUTH_MODE env variable:
 *   VITE_AUTH_MODE=mock   -> npm run dev:mock
 *   VITE_AUTH_MODE=real   -> npm run dev:real
 *
 * Online deployment: set your backend URL in localStorage:
 *   localStorage.setItem('pivot_api_url', 'https://your-app.onrender.com')
 */

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'mock'

// Priority: 1) localStorage override  2) env var  3) dev proxy  4) localhost fallback
export function getApiBaseUrl() {
  const lsUrl = localStorage.getItem('pivot_api_url')
  if (lsUrl) return lsUrl

  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl

  if (import.meta.env.DEV) return '' // dev proxy

  return 'https://web-production-98008.up.railway.app'
}

export function setApiBaseUrl(url) {
  if (!url || url.trim() === '') {
    localStorage.removeItem('pivot_api_url')
  } else {
    localStorage.setItem('pivot_api_url', url.trim().replace(/\/$/, ''))
  }
}

export const isMockMode = () => AUTH_MODE === 'mock'
export const isRealMode = () => AUTH_MODE === 'real'

// Detect if we're in a deployed (non-dev) environment with localhost fallback
export function isUsingLocalhostFallback() {
  if (import.meta.env.DEV) return false
  const url = getApiBaseUrl()
  return url.includes('localhost') || url.includes('127.0.0.1')
}

/**
 * Generic fetch wrapper with JWT auth
 */
export async function apiFetch(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path}`
  const token = localStorage.getItem('pivot_token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.message || `HTTP ${response.status}`
    const err = new Error(message)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

/**
 * Test if backend is reachable
 */
export async function testBackendConnection(baseUrl) {
  const testUrl = `${baseUrl.replace(/\/$/, '')}/api/health`
  try {
    const res = await fetch(testUrl, { method: 'GET', signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      return { ok: true, data }
    }
    return { ok: false, error: `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' }
  }
}

/* ─── Auth API ─── */

export async function apiRegister(userData) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function apiLogin(credentials) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function apiGetMe() {
  return apiFetch('/api/auth/me', { method: 'GET' })
}

export async function apiUpdatePreferences(preferences) {
  return apiFetch('/api/auth/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ preferences }),
  })
}

export async function apiCheckEmail(email) {
  return apiFetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`, { method: 'GET' })
}

export async function apiGetOptions({ role, sport } = {}) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (sport) params.set('sport', sport)
  const qs = params.toString()
  return apiFetch(`/api/auth/options${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

/* ─── Schools API ─── */

export async function apiSearchSchools(query) {
  if (!query || query.trim().length < 2) return []
  return apiFetch(`/api/schools?q=${encodeURIComponent(query.trim())}`, { method: 'GET' })
}

/* ─── Messages API ─── */

export async function apiListMessages({ unreadOnly = false, limit = 50 } = {}) {
  const params = new URLSearchParams()
  if (unreadOnly) params.set('unread', 'true')
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return apiFetch(`/api/messages${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiSendMessage({ recipientId, body, subject, alertLevel, alertType }) {
  return apiFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, body, subject, alertLevel, alertType }),
  })
}

export async function apiMarkMessageRead(id) {
  return apiFetch(`/api/messages/${id}/read`, { method: 'PATCH' })
}

export async function apiGetUnreadCount() {
  return apiFetch('/api/messages/unread-count', { method: 'GET' })
}

export async function apiListAthletes() {
  return apiFetch('/api/auth/athletes', { method: 'GET' })
}
