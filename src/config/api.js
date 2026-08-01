/**
 * API Configuration
 * - Mock mode: auth/data use localStorage (no backend needed for login)
 * - Real mode: auth/data connect to Flask backend API
 * - AI chat/insight ALWAYS call the real Kimi-backed Flask /api/ai/* endpoints
 *   (independent of mock/real auth mode)
 *
 * Switch mode via VITE_AUTH_MODE env variable:
 *   VITE_AUTH_MODE=mock   -> npm run dev:mock
 *   VITE_AUTH_MODE=real   -> npm run dev:real
 *
 * Online deployment: set your backend URL in localStorage:
 *   localStorage.setItem('pivot_api_url', 'https://your-app.onrender.com')
 */

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || (import.meta.env.PROD ? 'real' : 'mock')

/** Production Flask backend — auth/data fallback only (not used for local AI) */
const DEFAULT_BACKEND_URL = 'https://pivot-backend-production-690b.up.railway.app'

/** Local Flask — proxies AI to https://api.moonshot.cn/v1/chat/completions */
const LOCAL_AI_BACKEND_URL = 'http://localhost:5000'

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return ''
  return url.trim().replace(/\/$/, '')
}

function isFrontendHost(url) {
  const u = (url || '').toLowerCase()
  return u.includes('codebuddy.work') || u.includes('localhost:5173') || u.includes('127.0.0.1:5173')
}

function isRemoteDeployedBackend(url) {
  const u = (url || '').toLowerCase()
  return u.includes('railway.app') || u.includes('onrender.com') || u.includes('codebuddy.work')
}

// Priority: 1) localStorage override  2) env var  3) dev proxy  4) production backend
export function getApiBaseUrl() {
  const lsUrl = normalizeBaseUrl(localStorage.getItem('pivot_api_url'))
  if (lsUrl) return lsUrl

  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  if (envUrl) return envUrl

  if (import.meta.env.DEV) return '' // dev proxy

  return DEFAULT_BACKEND_URL
}

/**
 * Base URL for AI endpoints only.
 * Local/dev: always http://localhost:5000 — Flask then calls Moonshot directly
 * (api.moonshot.cn/v1/chat/completions with server-side MOONSHOT_API_KEY).
 * Never Railway / SPA hosts for AI during local development.
 */
export function getAiApiBaseUrl() {
  const aiEnv = normalizeBaseUrl(import.meta.env.VITE_AI_API_URL)
  if (aiEnv && !isFrontendHost(aiEnv) && !(import.meta.env.DEV && isRemoteDeployedBackend(aiEnv))) {
    return aiEnv
  }

  // Dev (mock or real): hit local Flask → Moonshot
  if (import.meta.env.DEV) return LOCAL_AI_BACKEND_URL

  const lsUrl = normalizeBaseUrl(localStorage.getItem('pivot_api_url'))
  if (lsUrl && !isFrontendHost(lsUrl)) return lsUrl

  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  if (envUrl && !isFrontendHost(envUrl)) return envUrl

  return DEFAULT_BACKEND_URL
}

export function setApiBaseUrl(url) {
  const normalized = normalizeBaseUrl(url)
  if (!normalized) {
    localStorage.removeItem('pivot_api_url')
  } else {
    localStorage.setItem('pivot_api_url', normalized)
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
 * @param {string} url
 * @param {RequestInit & { skipAuth?: boolean }} [options]
 *   skipAuth: do not inject pivot JWT (required for AI — Kimi uses its own Bearer key server-side)
 */
async function fetchJson(url, options = {}) {
  const { skipAuth = false, headers: optionHeaders, ...fetchOptions } = options

  const headers = {
    'Content-Type': 'application/json',
    ...optionHeaders,
  }

  // Never attach pivot JWT when skipAuth — avoids colliding with Moonshot Bearer semantics
  if (!skipAuth) {
    const token = localStorage.getItem('pivot_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } else {
    // Strip any caller-supplied Authorization so it cannot leak onto AI requests
    delete headers.Authorization
    delete headers.authorization
  }

  const response = await fetch(url, {
    ...fetchOptions,
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
 * Generic fetch wrapper with JWT auth (auth / messages / schools)
 */
export async function apiFetch(path, options = {}) {
  return fetchJson(`${getApiBaseUrl()}${path}`, options)
}

/**
 * Fetch wrapper for AI endpoints — always targets the real Kimi-backed backend.
 * Does NOT send Authorization: the Moonshot/Kimi key is injected only on the server.
 */
export async function apiAiFetch(path, options = {}) {
  return fetchJson(`${getAiApiBaseUrl()}${path}`, { ...options, skipAuth: true })
}

/**
 * Open a streaming AI request (SSE). Returns the raw Response — caller reads the body.
 * No Authorization header (same as apiAiFetch).
 */
export async function apiAiStream(path, options = {}) {
  const { headers: optionHeaders, ...fetchOptions } = options
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...optionHeaders,
  }
  delete headers.Authorization
  delete headers.authorization

  const response = await fetch(`${getAiApiBaseUrl()}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = data?.message || `HTTP ${response.status}`
    const err = new Error(message)
    err.status = response.status
    err.data = data
    throw err
  }

  return response
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
