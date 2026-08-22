import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { ATHLETES, ALERTS } from '../data/mockData'
import {
  isMockMode,
  apiListAthletes,
  apiGetCoachAlerts,
  apiGetAthleteAlerts,
  apiUpdateAlertStatus,
} from '../config/api'
import { useUser } from './UserContext'

const AlertContext = createContext()

function normalizeRosterAthlete(a) {
  if (!a) return null
  const health = Array.isArray(a.health) ? a.health : []
  return {
    ...a,
    name: a.name || 'Athlete',
    school: a.school || '',
    team: a.team || a.teamName || '',
    teamName: a.teamName || a.team || '',
    position: a.position || '',
    height: a.height ?? '—',
    weight: a.weight ?? '—',
    age: a.age ?? '—',
    status: a.status || 'unknown',
    currentHRV: a.currentHRV ?? a.hrv ?? 0,
    currentRHR: a.currentRHR ?? a.rhr ?? 0,
    currentSleep: a.currentSleep ?? a.sleepHours ?? 0,
    health,
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function AlertProvider({ children }) {
  const { user, authRestored } = useUser()
  const [alerts, setAlerts] = useState(ALERTS)
  const [realAthletes, setRealAthletes] = useState([])
  const [nudges, setNudges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshAlerts = useCallback(async () => {
    if (isMockMode()) return
    if (!user?.id) {
      setAlerts([])
      return
    }
    setLoading(true)
    try {
      const isCoach = user.role === 'coach'
      const data = isCoach ? await apiGetCoachAlerts() : await apiGetAthleteAlerts()
      const rows = data?.alerts || []
      setAlerts(rows.map(a => ({
        ...a,
        athleteId: a.athleteId ?? a.userId ?? a.user_id,
        athleteName: a.athleteName ?? a.userName ?? a.user_name,
        severity: a.severity ?? a.level,
        status: a.status ?? 'active',
        time: a.time ?? formatRelativeTime(a.createdAt ?? a.triggeredAt),
      })))
    } catch (err) {
      console.warn('Failed to load alerts:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role])

  // In real mode, load the actual athlete roster and real alerts once auth is restored.
  useEffect(() => {
    if (isMockMode() || !authRestored) return
    let cancelled = false
    async function load() {
      if (!user?.id) {
        if (!cancelled) {
          setRealAthletes([])
          setAlerts([])
        }
        return
      }
      setLoading(true)
      setError(null)
      try {
        if (user.role === 'coach') {
          const athletesData = await apiListAthletes()
          if (!cancelled) {
            setRealAthletes((athletesData?.athletes || []).map(normalizeRosterAthlete))
          }
        } else if (!cancelled) {
          setRealAthletes([])
        }
      } catch (err) {
        if (!cancelled) {
          setRealAthletes([])
          setError(err.message || 'Failed to load athletes')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
      if (!cancelled) await refreshAlerts()
    }
    load()
    return () => { cancelled = true }
  }, [user?.id, user?.role, authRestored, refreshAlerts])

  const totalAlerts = alerts.length
  const alertCount = useMemo(() => ({
    yellow: alerts.filter(a => a.level === 'yellow' && a.status !== 'actioned').length,
    red: alerts.filter(a => a.level === 'red' && a.status !== 'actioned').length,
    black: alerts.filter(a => a.level === 'black' && a.status !== 'actioned').length,
  }), [alerts])

  const dismissAlert = useCallback(async (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'dismissed', dismissedAt: new Date().toISOString() } : a))
    if (!isMockMode()) {
      try { await apiUpdateAlertStatus(alertId, 'dismissed') } catch { /* keep local state */ }
    }
  }, [])

  const actionAlert = useCallback(async (alertId, interventionType) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? {
      ...a,
      status: 'actioned',
      actionedAt: new Date().toISOString(),
      interventionType,
    } : a))
    if (!isMockMode()) {
      try { await apiUpdateAlertStatus(alertId, 'resolved') } catch { /* keep local state */ }
    }
  }, [])

  const sendNudge = useCallback((alertId, athleteId, message, checkInPrompt) => {
    const nudge = {
      id: `nudge-${Date.now()}`,
      alertId,
      athleteId,
      message,
      checkInPrompt,
      sentAt: new Date().toISOString(),
      respondedAt: null,
      status: 'pending',
    }
    setNudges(prev => [nudge, ...prev])
    actionAlert(alertId, 'nudge')
    return nudge
  }, [actionAlert])

  const respondToNudge = useCallback((nudgeId, checkInData) => {
    const respondedAt = new Date().toISOString()
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, status: 'responded', respondedAt, checkInData } : n))
    // Also mark any linked alert as actioned with follow-up timestamp
    const nudge = nudges.find(n => n.id === nudgeId)
    if (nudge?.alertId) {
      setAlerts(prev => prev.map(a => a.id === nudge.alertId ? { ...a, status: 'actioned', respondedAt } : a))
    }
  }, [nudges])

  const activeNudgesForAthlete = useCallback((athleteId) => {
    return nudges.filter(n => n.athleteId === athleteId && n.status === 'pending')
  }, [nudges])

  const hasPendingNudge = useCallback((athleteId) => {
    return nudges.some(n => n.athleteId === athleteId && n.status === 'pending')
  }, [nudges])

  const clearAllNudges = useCallback(() => setNudges([]), [])

  const athletes = isMockMode() ? ATHLETES : realAthletes

  const value = {
    alerts,
    setAlerts,
    nudges,
    totalAlerts,
    alertCount,
    athletes,
    loading,
    error,
    refreshAlerts,
    dismissAlert,
    actionAlert,
    sendNudge,
    respondToNudge,
    activeNudgesForAthlete,
    hasPendingNudge,
    clearAllNudges,
  }

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
