import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, useRef,
} from 'react'
import { useUser } from './UserContext'
import {
  isMockMode,
  apiGetAthleteDashboard,
  apiListCheckins,
  apiGetTodayCheckin,
  apiGetUnreadCount,
  apiGetHealthMetrics,
  apiGetTrainingMetrics,
} from '../config/api'
import { ATHLETES } from '../data/mockData'
import { prefetchAthleteTabs } from '../utils/prefetchAthleteRoutes'

const AthleteDataContext = createContext(null)
const STALE_MS = 60_000
const RANGE_DAYS = { '7d': 7, '30d': 30, '180d': 180 }

function computeHrvTrend(health) {
  if (!health || health.length < 2) return 'stable'
  const first = health[0].hrv
  const last = health[health.length - 1].hrv
  const changePct = first !== 0 ? ((last - first) / first) * 100 : 0
  if (changePct < -10) return 'severe_decline'
  if (changePct < -5) return 'declining'
  if (changePct > 5) return 'improving'
  return 'stable'
}

function buildAthleteFromDashboard(dashboard) {
  if (!dashboard?.success) return null
  const health = [...(dashboard.health || [])].reverse()
  const training = [...(dashboard.training || [])].reverse()
  const checkins = [...(dashboard.checkins || [])].reverse()
  const summary = dashboard.summary || {}
  return {
    ...dashboard.athlete,
    team: dashboard.athlete?.teamName || dashboard.athlete?.team || '',
    health,
    training,
    checkins,
    status: summary.status || 'good',
    hrvTrend: computeHrvTrend(health),
    currentHRV: summary.hrv ?? (health[health.length - 1]?.hrv || '-'),
    currentRHR: summary.rhr ?? (health[health.length - 1]?.rhr || '-'),
    currentSleep: summary.sleepHours ?? (health[health.length - 1]?.sleepHours || '-'),
  }
}

function mockAthleteForUser(user) {
  const displayName = user?.name || 'Morgan Smith'
  const mockAthlete = ATHLETES.find(a => a.name === displayName)
    || ATHLETES.find(a => a.name === 'Morgan Smith')
    || ATHLETES[0]
  return {
    ...mockAthlete,
    team: mockAthlete.team || mockAthlete.teamName || '',
    health: mockAthlete.health || [],
    training: mockAthlete.training || [],
    checkins: mockAthlete.checkins || [],
    status: mockAthlete.status || 'good',
    hrvTrend: computeHrvTrend(mockAthlete.health || []),
    currentHRV: mockAthlete.currentHRV ?? (mockAthlete.health?.[mockAthlete.health.length - 1]?.hrv || '-'),
    currentRHR: mockAthlete.currentRHR ?? (mockAthlete.health?.[mockAthlete.health.length - 1]?.rhr || '-'),
    currentSleep: mockAthlete.currentSleep ?? (mockAthlete.health?.[mockAthlete.health.length - 1]?.sleepHours || '-'),
  }
}

export function AthleteDataProvider({ children }) {
  const { user, authRestored } = useUser()
  const [dashboard, setDashboard] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [todayCheckin, setTodayCheckin] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [metricsByRange, setMetricsByRange] = useState({})
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapReady, setBootstrapReady] = useState(isMockMode())
  const lastBootstrapRef = useRef(0)
  const metricsInflightRef = useRef({})

  const isAthlete = user?.role === 'athlete'

  const bootstrap = useCallback(async (force = false) => {
    if (isMockMode()) {
      if (!user) return
      const mock = mockAthleteForUser(user)
      setCheckins((mock.checkins || []).map(c => ({ ...c, day: c.day || c.date })))
      setBootstrapReady(true)
      return
    }
    if (!user?.id || user.role !== 'athlete') return
    if (!force && lastBootstrapRef.current && Date.now() - lastBootstrapRef.current < STALE_MS) {
      return
    }

    setBootstrapLoading(true)
    try {
      const [dashRes, checkinRes, todayRes, unreadRes] = await Promise.all([
        apiGetAthleteDashboard({ days: 7 }),
        apiListCheckins({ limit: 30, offset: 0, fields: 'light' }),
        apiGetTodayCheckin().catch(() => null),
        apiGetUnreadCount().catch(() => ({ unreadCount: 0 })),
      ])
      if (dashRes?.success) setDashboard(dashRes)
      const rows = (checkinRes?.checkins || []).map(c => ({ ...c, day: c.date || c.day }))
      setCheckins(rows)
      setTodayCheckin(todayRes?.checkin || null)
      setUnreadCount(unreadRes?.unreadCount || 0)
      lastBootstrapRef.current = Date.now()
      setBootstrapReady(true)
    } catch (err) {
      console.warn('Athlete bootstrap failed:', err.message)
    } finally {
      setBootstrapLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authRestored || !isAthlete) return
    bootstrap()
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => prefetchAthleteTabs(), { timeout: 2000 })
      : setTimeout(() => prefetchAthleteTabs(), 500)
    return () => {
      if (window.cancelIdleCallback && typeof idle === 'number') window.cancelIdleCallback(idle)
      else clearTimeout(idle)
    }
  }, [authRestored, isAthlete, bootstrap])

  const ensureTrendMetrics = useCallback(async (rangeKey) => {
    const days = RANGE_DAYS[rangeKey] || 7
    if (isMockMode()) {
      const mock = mockAthleteForUser(user)
      return {
        health: mock.health || [],
        training: mock.training || [],
        fromCache: true,
      }
    }
    if (!user?.id) return { health: [], training: [], fromCache: false }

    const cached = metricsByRange[rangeKey]
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
      return { health: cached.health, training: cached.training, fromCache: true }
    }

    // Reuse bootstrap dashboard data for 7-day range (C1)
    if (rangeKey === '7d' && dashboard?.success) {
      const health = [...(dashboard.health || [])].reverse().map(r => ({ ...r, day: r.day || r.date }))
      const training = [...(dashboard.training || [])].reverse().map(r => ({ ...r, day: r.day || r.date }))
      if (health.length > 0) {
        setMetricsByRange(prev => ({
          ...prev,
          '7d': { health, training, fetchedAt: Date.now() },
        }))
        return { health, training, fromCache: true }
      }
    }

    if (metricsInflightRef.current[rangeKey]) {
      return metricsInflightRef.current[rangeKey]
    }

    const promise = Promise.all([
      apiGetHealthMetrics(user.id, { limit: days }),
      apiGetTrainingMetrics(user.id, { limit: days }),
    ]).then(([healthRes, trainingRes]) => {
      const health = (healthRes?.metrics || []).map(r => ({ ...r, day: r.day || r.date })).reverse()
      const training = (trainingRes?.metrics || []).map(r => ({ ...r, day: r.day || r.date })).reverse()
      setMetricsByRange(prev => ({
        ...prev,
        [rangeKey]: { health, training, fetchedAt: Date.now() },
      }))
      delete metricsInflightRef.current[rangeKey]
      return { health, training, fromCache: false }
    }).catch(err => {
      delete metricsInflightRef.current[rangeKey]
      throw err
    })

    metricsInflightRef.current[rangeKey] = promise
    return promise
  }, [user, metricsByRange, dashboard])

  const refreshAfterCheckin = useCallback(async () => {
    if (isMockMode()) return
    const [todayRes, checkinRes, dashRes] = await Promise.all([
      apiGetTodayCheckin().catch(() => null),
      apiListCheckins({ limit: 30, offset: 0, fields: 'light' }),
      apiGetAthleteDashboard({ days: 7 }),
    ])
    if (todayRes?.checkin) setTodayCheckin(todayRes.checkin)
    if (checkinRes?.checkins) {
      setCheckins(checkinRes.checkins.map(c => ({ ...c, day: c.date || c.day })))
    }
    if (dashRes?.success) setDashboard(dashRes)
    lastBootstrapRef.current = Date.now()
  }, [])

  const athlete = useMemo(() => {
    if (isMockMode() && user) return mockAthleteForUser(user)
    return buildAthleteFromDashboard(dashboard)
  }, [dashboard, user])

  const value = useMemo(() => ({
    athlete,
    dashboard,
    checkins,
    todayCheckin,
    unreadCount,
    bootstrapLoading,
    bootstrapReady,
    metricsByRange,
    bootstrap,
    ensureTrendMetrics,
    refreshAfterCheckin,
    setCheckins,
  }), [
    athlete, dashboard, checkins, todayCheckin, unreadCount,
    bootstrapLoading, bootstrapReady, metricsByRange,
    bootstrap, ensureTrendMetrics, refreshAfterCheckin,
  ])

  return (
    <AthleteDataContext.Provider value={value}>
      {children}
    </AthleteDataContext.Provider>
  )
}

export function useAthleteData() {
  const ctx = useContext(AthleteDataContext)
  if (!ctx) throw new Error('useAthleteData must be used within AthleteDataProvider')
  return ctx
}

/** Safe hook for components that may render outside athlete layout. */
export function useAthleteDataOptional() {
  return useContext(AthleteDataContext)
}
