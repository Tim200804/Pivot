import React, { createContext, useContext, useState, useCallback } from 'react'
import { ATHLETES, ALERTS } from '../data/mockData'

const AlertContext = createContext()

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState(ALERTS)
  const [nudges, setNudges] = useState([])

  const totalAlerts = alerts.length
  const alertCount = useMemo(() => ({
    yellow: alerts.filter(a => a.level === 'yellow' && a.status !== 'actioned').length,
    red: alerts.filter(a => a.level === 'red' && a.status !== 'actioned').length,
    black: alerts.filter(a => a.level === 'black' && a.status !== 'actioned').length,
  }), [alerts])

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'dismissed', dismissedAt: new Date().toISOString() } : a))
  }, [])

  const actionAlert = useCallback((alertId, interventionType) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? {
      ...a,
      status: 'actioned',
      actionedAt: new Date().toISOString(),
      interventionType,
    } : a))
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

  const value = {
    alerts,
    setAlerts,
    nudges,
    totalAlerts,
    alertCount,
    athletes: ATHLETES,
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
