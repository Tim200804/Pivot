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
  // In production, ignore localhost localStorage overrides (common dev leftover)
  if (lsUrl && !(!import.meta.env.DEV && (lsUrl.includes('localhost') || lsUrl.includes('127.0.0.1')))) {
    return lsUrl
  }

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
  // In production, ignore localhost localStorage overrides
  if (lsUrl && !isFrontendHost(lsUrl) && !(lsUrl.includes('localhost') || lsUrl.includes('127.0.0.1'))) return lsUrl

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

export async function apiUpdateProfile(profile) {
  return apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(profile),
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

/* ─── Password Reset API ─── */

export async function apiForgotPassword(email) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function apiVerifyResetCode(email, code) {
  return apiFetch('/api/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function apiResetPassword(email, code, newPassword) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  })
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

export async function apiGetConversation(otherUserId, { limit = 200 } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return apiFetch(`/api/messages/conversation/${otherUserId}${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiListAthletes() {
  return apiFetch('/api/auth/athletes', { method: 'GET' })
}

export async function apiListCoaches() {
  return apiFetch('/api/auth/coaches', { method: 'GET' })
}

export async function apiAssignAthletes({ athleteIds, coachId }) {
  return apiFetch('/api/auth/assign-athletes', {
    method: 'POST',
    body: JSON.stringify({ athleteIds, coachId }),
  })
}

/* ─── Check-ins API ─── */

export async function apiListCheckins({ limit = 30, offset = 0, fields = 'light' } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  if (fields) params.set('fields', fields)
  const qs = params.toString()
  return apiFetch(`/api/checkins${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiGetTodayCheckin() {
  return apiFetch('/api/checkins/today', { method: 'GET' })
}

export async function apiSubmitCheckin(checkin) {
  return apiFetch('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(checkin),
  })
}

/* ─── Health / Training metrics API ─── */

export async function apiGetHealthMetrics(userId, { limit = 180 } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  return apiFetch(`/api/health/metrics/${userId}${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' })
}

export async function apiGetTrainingMetrics(userId, { limit = 180 } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  return apiFetch(`/api/health/training/${userId}${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' })
}

export async function apiGetHealthSummary(userId) {
  return apiFetch(`/api/health/summary/${userId}`, { method: 'GET' })
}

export async function apiGetTeamSummary() {
  return apiFetch('/api/health/team-summary', { method: 'GET' })
}

export async function apiGetAthleteDashboard({ days = 7 } = {}) {
  const params = new URLSearchParams()
  if (days) params.set('days', String(days))
  const qs = params.toString()
  return apiFetch(`/api/health/dashboard${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiGetTrainingImpact(userId, date) {
  const params = new URLSearchParams()
  params.set('date', date)
  return apiFetch(`/api/health/training-impact/${userId}?${params.toString()}`, { method: 'GET' })
}

export async function apiGetTrainingCorrelation(userId, { days = 28 } = {}) {
  const params = new URLSearchParams()
  params.set('days', String(days))
  return apiFetch(`/api/health/correlation/${userId}?${params.toString()}`, { method: 'GET' })
}

/* ─── Alerts API ─── */

export async function apiGetAthleteAlerts({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const qs = params.toString()
  return apiFetch(`/api/alerts/athlete${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiGetCoachAlerts({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const qs = params.toString()
  return apiFetch(`/api/alerts/coach${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiUpdateAlertStatus(alertId, status) {
  return apiFetch(`/api/alerts/${alertId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function apiGetAlertRules({ sport } = {}) {
  const params = new URLSearchParams()
  if (sport) params.set('sport', sport)
  const qs = params.toString()
  return apiFetch(`/api/alerts/rules${qs ? `?${qs}` : ''}`, { method: 'GET' })
}

export async function apiEvaluateAlerts(userId) {
  return apiFetch(`/api/alerts/evaluate/${userId}`, { method: 'POST' })
}

/* ─── Interventions API ─── */

export async function apiListInterventions({ athleteId, alertId, status, limit = 100 } = {}) {
  const params = new URLSearchParams()
  if (athleteId) params.set('athlete_id', String(athleteId))
  if (alertId) params.set('alert_id', String(alertId))
  if (status) params.set('status', status)
  if (limit) params.set('limit', String(limit))
  return apiFetch(`/api/interventions?${params.toString()}`, { method: 'GET' })
}

export async function apiGetIntervention(id) {
  return apiFetch(`/api/interventions/${id}`, { method: 'GET' })
}

export async function apiCreateIntervention(payload) {
  return apiFetch('/api/interventions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function apiUpdateIntervention(id, payload) {
  return apiFetch(`/api/interventions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function apiDeleteIntervention(id) {
  return apiFetch(`/api/interventions/${id}`, { method: 'DELETE' })
}

/* ─── AI training suggestion API ─── */

export async function apiGetTrainingSuggestion(userId, { days = 14 } = {}) {
  const params = new URLSearchParams()
  params.set('days', String(days))
  return apiFetch(`/api/health/training-suggestion/${userId}?${params.toString()}`, { method: 'GET' })
}

/* ─── Substitution / leave request API ─── */

export async function apiListSubstitutionRequests() {
  return apiFetch('/api/substitutions', { method: 'GET' })
}

export async function apiListSubstitutionCandidates() {
  return apiFetch('/api/substitutions/candidates', { method: 'GET' })
}

export async function apiListCoachSubstitutionCandidates(athleteId) {
  return apiFetch(`/api/substitutions/coach-candidates?athleteId=${encodeURIComponent(athleteId)}`, { method: 'GET' })
}

export async function apiCreateSubstitutionRequest({ trainingDate, reason, substituteId }) {
  return apiFetch('/api/substitutions', {
    method: 'POST',
    body: JSON.stringify({ trainingDate, reason, substituteId }),
  })
}

export async function apiRespondSubstitutionRequest(requestId, accept, note = '') {
  return apiFetch(`/api/substitutions/${requestId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept, note }),
  })
}

export async function apiCoachApproveSubstitutionRequest(requestId, approve, note) {
  return apiFetch(`/api/substitutions/${requestId}/coach-approve`, {
    method: 'POST',
    body: JSON.stringify({ approve, note }),
  })
}

export async function apiCoachInitiateSubstitution({ athleteId, substituteId, trainingDate, reason }) {
  return apiFetch('/api/substitutions/coach-initiate', {
    method: 'POST',
    body: JSON.stringify({ athleteId, substituteId, trainingDate, reason }),
  })
}

export async function apiCoachSendSubstitutionMessage({ athleteId }) {
  return apiFetch('/api/substitutions/coach-message', {
    method: 'POST',
    body: JSON.stringify({ athleteId }),
  })
}
