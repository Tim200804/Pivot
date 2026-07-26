/**
 * API Configuration
 * - Mock mode: uses localStorage and in-memory data (no backend needed)
 * - Real mode: connects to Flask backend API
 *
 * Switch mode via VITE_AUTH_MODE env variable:
 *   VITE_AUTH_MODE=mock   -> npm run dev:mock
 *   VITE_AUTH_MODE=real   -> npm run dev:real
 *
 * Online deployment: set your Render backend URL in localStorage:
 *   localStorage.setItem('pivot_api_url', 'https://your-app.onrender.com')
 */

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'mock'

// Priority: 1) localStorage override  2) env var  3) dev proxy  4) localhost fallback
function getApiBaseUrl() {
  const lsUrl = localStorage.getItem('pivot_api_url')
  if (lsUrl) return lsUrl

  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl

  if (import.meta.env.DEV) return '' // dev proxy

  return 'http://localhost:5001'
}

const API_BASE_URL = getApiBaseUrl()

export const isMockMode = () => AUTH_MODE === 'mock'
export const isRealMode = () => AUTH_MODE === 'real'

export const API_URL = API_BASE_URL

/**
 * Generic fetch wrapper with JWT auth
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`
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
