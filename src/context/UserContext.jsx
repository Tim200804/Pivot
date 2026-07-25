import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { isMockMode, apiLogin, apiRegister } from '../config/api'

const UserContext = createContext(null)

const STORAGE_KEY = 'pivot_saved_users'
const TOKEN_KEY = 'pivot_token'

const ROWING_POSITIONS = [
  'Stroke Seat', '7 Seat', '6 Seat', '5 Seat', '4 Seat',
  '3 Seat', '2 Seat', 'Bow Seat', 'Coxswain', 'Sculler',
  'Port', 'Starboard',
]

const BASKETBALL_POSITIONS = [
  'Point Guard (PG)', 'Shooting Guard (SG)', 'Small Forward (SF)',
  'Power Forward (PF)', 'Center (C)',
]

const TOP_SCHOOLS = {
  rowing: [
    { name: 'University of Pennsylvania', region: 'Ivy League' },
    { name: 'Harvard University', region: 'Ivy League' },
    { name: 'Yale University', region: 'Ivy League' },
    { name: 'Princeton University', region: 'Ivy League' },
    { name: 'Cornell University', region: 'Ivy League' },
    { name: 'Dartmouth College', region: 'Ivy League' },
    { name: 'Brown University', region: 'Ivy League' },
    { name: 'Columbia University', region: 'Ivy League' },
    { name: 'Stanford University', region: 'Pac-12' },
    { name: 'UC Berkeley', region: 'Pac-12' },
    { name: 'University of Washington', region: 'Pac-12' },
    { name: 'University of Michigan', region: 'Big Ten' },
    { name: 'University of Wisconsin', region: 'Big Ten' },
    { name: 'Ohio State University', region: 'Big Ten' },
    { name: 'University of Virginia', region: 'ACC' },
    { name: 'University of Texas', region: 'Big 12' },
    { name: 'University of Cambridge', region: 'UK' },
    { name: 'University of Oxford', region: 'UK' },
    { name: '清华大学', region: '中国' },
    { name: '北京大学', region: '中国' },
    { name: '上海交通大学', region: '中国' },
    { name: '浙江大学', region: '中国' },
  ],
  basketball: [
    { name: 'Duke University', region: 'ACC' },
    { name: 'University of North Carolina', region: 'ACC' },
    { name: 'University of Kentucky', region: 'SEC' },
    { name: 'University of Kansas', region: 'Big 12' },
    { name: 'Michigan State University', region: 'Big Ten' },
    { name: 'UCLA', region: 'Big Ten' },
    { name: 'UConn', region: 'Big East' },
    { name: 'Villanova University', region: 'Big East' },
    { name: 'Gonzaga University', region: 'WCC' },
    { name: 'University of Arizona', region: 'Big 12' },
    { name: 'University of Michigan', region: 'Big Ten' },
    { name: 'University of Virginia', region: 'ACC' },
    { name: 'Stanford University', region: 'ACC' },
    { name: 'University of Florida', region: 'SEC' },
    { name: 'University of Houston', region: 'Big 12' },
    { name: '清华大学', region: '中国' },
    { name: '北京大学', region: '中国' },
    { name: '华侨大学', region: '中国' },
    { name: '太原理工大学', region: '中国' },
  ],
}

const COACH_ROLES = [
  'Head Coach',
  'Assistant Coach',
  'Strength & Conditioning Coach',
  'Sports Psychologist',
  'Athletic Trainer',
  'Performance Analyst',
]

function loadSavedProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch {
    // localStorage full or unavailable
  }
}

function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [savedProfiles, setSavedProfiles] = useState(loadSavedProfiles)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    saveProfiles(savedProfiles)
  }, [savedProfiles])

  const mockLogin = useCallback((data, rememberMe = false) => {
    setUser(data)
    if (rememberMe) {
      setSavedProfiles(prev => {
        const existing = prev.findIndex(p => p.email === data.email)
        const profile = { ...data, savedAt: Date.now() }
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = profile
          return updated
        }
        return [...prev, profile]
      })
    }
  }, [])

  const realLogin = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const res = await apiLogin(credentials)
      if (res.success && res.token) {
        saveToken(res.token)
        setUser(res.user)
        return { success: true, user: res.user }
      }
      return { success: false, message: res.message || 'Login failed' }
    } catch (err) {
      return { success: false, message: err.message || 'Network error' }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (data, rememberMe = false) => {
    if (isMockMode()) {
      mockLogin(data, rememberMe)
      return { success: true }
    }
    // Real mode: data should contain email + password
    return realLogin(data)
  }, [mockLogin, realLogin])

  const mockRegister = useCallback((data, rememberMe = false) => {
    mockLogin(data, rememberMe)
    return { success: true }
  }, [mockLogin])

  const realRegister = useCallback(async (userData) => {
    setLoading(true)
    try {
      const res = await apiRegister(userData)
      if (res.success && res.token) {
        saveToken(res.token)
        setUser(res.user)
        return { success: true, user: res.user }
      }
      return { success: false, message: res.message || 'Registration failed' }
    } catch (err) {
      return { success: false, message: err.message || 'Network error' }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data, rememberMe = false) => {
    if (isMockMode()) {
      return mockRegister(data, rememberMe)
    }
    return realRegister(data)
  }, [mockRegister, realRegister])

  const logout = useCallback(() => {
    setUser(null)
    saveToken(null)
  }, [])

  const forgetProfile = useCallback((email) => {
    setSavedProfiles(prev => prev.filter(p => p.email !== email))
  }, [])

  const findSavedProfile = useCallback((email) => {
    return savedProfiles.find(p => p.email === email) || null
  }, [savedProfiles])

  const getPositionsForSport = (sport) => {
    return sport === 'rowing' ? ROWING_POSITIONS : BASKETBALL_POSITIONS
  }

  const getSchoolsForSport = (sport) => {
    const sportSchools = TOP_SCHOOLS[sport] || []
    const otherSchools = TOP_SCHOOLS[sport === 'rowing' ? 'basketball' : 'rowing'] || []
    const allNames = new Set()
    const merged = []
    for (const s of [...sportSchools, ...otherSchools]) {
      if (!allNames.has(s.name)) {
        allNames.add(s.name)
        merged.push(s)
      }
    }
    return merged
  }

  const value = {
    user, login, logout, register, forgetProfile, findSavedProfile, savedProfiles,
    loading, isMockMode,
    getPositionsForSport, getSchoolsForSport, COACH_ROLES,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

export { ROWING_POSITIONS, BASKETBALL_POSITIONS, TOP_SCHOOLS, COACH_ROLES }
