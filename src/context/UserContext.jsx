import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const UserContext = createContext(null)

const STORAGE_KEY = 'pivot_saved_users'

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

// Load saved profiles from localStorage
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
    // localStorage full or unavailable — silently ignore
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [savedProfiles, setSavedProfiles] = useState(loadSavedProfiles)

  // Sync savedProfiles to localStorage whenever it changes
  useEffect(() => {
    saveProfiles(savedProfiles)
  }, [savedProfiles])

  const login = useCallback((data, rememberMe = false) => {
    setUser(data)

    if (rememberMe) {
      setSavedProfiles(prev => {
        // Replace existing profile with same email, or append
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

  const logout = useCallback(() => {
    setUser(null)
    // Don't remove from savedProfiles — just clear current session
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
    user, login, logout, forgetProfile, findSavedProfile, savedProfiles,
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
