import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Activity, Bell, TrendingUp, Heart, Moon, AlertTriangle,
  Menu, X, Search, ChevronRight, XCircle, BarChart3, CheckCircle,
  GraduationCap, Ruler, Weight, ClipboardCheck, MoreVertical, MessageCircle, CheckCheck,
  History, ArrowRight, Dumbbell
} from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge, { StatusPill } from '../ui/AlertBadge'
import HealthTrendChart from '../ui/HealthTrendChart'
import InterventionModal from '../ui/InterventionModal'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { useAlerts } from '../../context/AlertContext'
import { useMoodColors } from '../../context/MoodColorContext'
import { isMockMode, apiGetTeamSummary } from '../../config/api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const Toast = memo(function Toast({ message, visible, variant }) {
  const bg = variant === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl ${bg} text-white shadow-xl text-sm font-medium will-change-transform`}
        >
          <CheckCircle size={18} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// Compute team 7-day aggregate from actual athlete data.
// Real backend athletes currently carry a `latest` summary; full 7-day series
// would require per-athlete metric fetches. Here we safely fall back to empty
// trend points when embedded health arrays are unavailable.
function computeTeamTrendData(athletes) {
  if (!athletes?.length || !athletes[0]?.health) {
    return DAYS.map(day => ({ day, hrv: 0, rhr: 0, sleepHours: 0 }))
  }
  return DAYS.map((day, i) => {
    const hrvSum = athletes.reduce((s, a) => s + (a.health[i]?.hrv || 0), 0)
    const rhrSum = athletes.reduce((s, a) => s + (a.health[i]?.rhr || 0), 0)
    const sleepSum = athletes.reduce((s, a) => s + (a.health[i]?.sleepHours || 0), 0)
    const n = athletes.length
    return {
      day,
      hrv: Math.round(hrvSum / n),
      rhr: Math.round(rhrSum / n),
      sleepHours: Math.round(sleepSum / n * 10) / 10,
    }
  })
}

export default function CoachDashboard() {
  const { theme } = useTheme()
  const { user } = useUser()
  const { alerts, totalAlerts, alertCount, dismissAlert, sendNudge, athletes: realAthletes } = useAlerts()
  const { palette } = useMoodColors()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' })
  const [actionMenu, setActionMenu] = useState(null)
  const [interventionAlert, setInterventionAlert] = useState(null)
  const [teamSummary, setTeamSummary] = useState(null)

  const athletes = useMemo(() => {
    if (isMockMode()) return []
    return teamSummary?.athletes?.length ? teamSummary.athletes : realAthletes
  }, [teamSummary, realAthletes])

  // Lock body scroll when mobile menu or athlete modal is open
  useEffect(() => {
    if (mobileMenuOpen || selectedAthlete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen, selectedAthlete])

  // Fetch real team summary from backend
  useEffect(() => {
    if (isMockMode() || !user?.id || user.role !== 'coach') return
    let cancelled = false
    apiGetTeamSummary()
      .then(data => {
        if (!cancelled) setTeamSummary(data?.summary || null)
      })
      .catch(() => {
        if (!cancelled) setTeamSummary(null)
      })
    return () => { cancelled = true }
  }, [user?.id])

  const teamAgg = useMemo(() => {
    if (isMockMode()) {
      return { teamName: 'Varsity Heavyweight 8+', totalAthletes: 6, healthScore: 72, avgHRV: 54, avgRHR: 56, avgSleep: 6.8 }
    }
    return {
      teamName: user?.teamName || 'Your Team',
      totalAthletes: teamSummary?.totalAthletes ?? athletes.length,
      healthScore: teamSummary?.healthScore ?? 100,
      avgHRV: teamSummary?.avgHRV ?? 0,
      avgRHR: teamSummary?.avgRHR ?? 0,
      avgSleep: teamSummary?.avgSleep ?? 0,
    }
  }, [teamSummary, athletes, user?.teamName])

  const teamTrendData = useMemo(() => computeTeamTrendData(athletes), [athletes])

  const filteredAthletes = useMemo(() =>
    searchQuery
      ? athletes.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : athletes,
    [searchQuery, athletes]
  )

  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts])

  const showToast = useCallback((msg, variant = 'success') => {
    setToast({ visible: true, message: msg, variant })
    setTimeout(() => setToast({ visible: false, message: '', variant: 'success' }), 2500)
  }, [])

  const handleDismissAlert = useCallback((alert) => {
    dismissAlert(alert.id)
    setActionMenu(null)
    setInterventionAlert(null)
    showToast(`Alert for ${alert.athleteName} marked as addressed`)
  }, [dismissAlert, showToast])

  const handleSendNudge = useCallback((alert, suggestion) => {
    const nudgeMessage = suggestion.text
    const checkInPrompt = suggestion.checkInPrompt || 'How are you feeling right now?'
    sendNudge(alert.id, alert.athleteId, nudgeMessage, checkInPrompt)
    setInterventionAlert(null)
    setActionMenu(null)
    showToast(`Nudge sent to ${alert.athleteName}`)
  }, [sendNudge, showToast])

  // Handle intervention action completed
  const handleInterventionAction = (action, message) => {
    if (interventionAlert) {
      dismissAlert(interventionAlert.id)
    }
    setInterventionAlert(null)
    showToast(message, action === 'dismiss' ? 'error' : 'success')
  }

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="coach" />

      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        {/* Mobile header */}
        <header className="md:hidden glass-card rounded-none border-b border-pivot-100/60 dark:border-slate-700/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#0a1050]/90 flex items-center justify-center overflow-hidden">
              <img src="/pivot-logo.png" alt="Pivot Logo" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="font-bold text-pivot-900 dark:text-white">Pivot Coach</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden glass-card p-4 mx-4 mt-2 space-y-1"
            >
              <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="sidebar-link sidebar-link-active w-full">
                <Activity size={20} /> Team Overview
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/coach/alerts') }} className="sidebar-link sidebar-link-inactive w-full">
                <Bell size={20} /> Alerts
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/coach/roster') }} className="sidebar-link sidebar-link-inactive w-full">
                <Users size={20} /> Roster
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/coach/settings') }} className="sidebar-link sidebar-link-inactive w-full">
                <Activity size={20} /> Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                  {teamAgg.teamName}
                </h2>
                <p className="text-sm text-pivot-500 dark:text-slate-400">
                  {teamAgg.totalAthletes} athletes · Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search athletes..."
                    className="pl-9 pr-4 py-2 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 w-48"
                  />
                </div>
                <button
                  onClick={() => navigate('/coach/alerts')}
                  className="relative p-3 rounded-2xl border transition-all hover:shadow-glass active:scale-95"
                  style={{
                    borderColor: totalAlerts > 0 ? palette.accentBorder : undefined,
                    backgroundColor: totalAlerts > 0 ? palette.bgAccent : undefined,
                  }}
                >
                  <Bell size={20} style={{ color: totalAlerts > 0 ? palette.accent : undefined }} />
                  {totalAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
                      style={{ background: palette.gradient }}>
                      {totalAlerts}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Coach Identity Bar */}
            {user && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-pivot-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-pivot-400 shrink-0" />
                  {user.school || 'Your School'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-pivot-400 shrink-0" />
                  {user.teamName || 'Your Team'}
                </span>
                {user.coachRole && (
                  <span className="text-accent-teal dark:text-teal-400 font-semibold">{user.coachRole}</span>
                )}
                {user.name && <span className="text-pivot-400 dark:text-slate-500">— {user.name}</span>}
              </div>
            )}
          </motion.div>

          {/* Team Health Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 text-center cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate('/coach/roster')}>
              <div className="relative inline-flex items-center justify-center mb-3">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none"
                    stroke={teamAgg.healthScore >= 75 ? '#10b981' : teamAgg.healthScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${teamAgg.healthScore * 0.97} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-pivot-900 dark:text-white">{teamAgg.healthScore}%</span>
              </div>
              <p className="text-xs font-semibold text-pivot-500 dark:text-slate-400">Team Health Score</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Heart size={18} className="text-accent-blue" />
                <span className="text-xs font-semibold text-pivot-500 dark:text-slate-400">Avg HRV</span>
              </div>
              <p className="text-2xl font-bold text-pivot-900 dark:text-white">{teamAgg.avgHRV}<span className="text-sm font-normal text-pivot-400 ml-1">ms</span></p>
              <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">Team average</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Activity size={18} className="text-rose-500" />
                <span className="text-xs font-semibold text-pivot-500 dark:text-slate-400">Avg RHR</span>
              </div>
              <p className="text-2xl font-bold text-pivot-900 dark:text-white">{teamAgg.avgRHR}<span className="text-sm font-normal text-pivot-400 ml-1">bpm</span></p>
              <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">Team average</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Moon size={18} className="text-accent-teal" />
                <span className="text-xs font-semibold text-pivot-500 dark:text-slate-400">Avg Sleep</span>
              </div>
              <p className="text-2xl font-bold text-pivot-900 dark:text-white">{teamAgg.avgSleep}<span className="text-sm font-normal text-pivot-400 ml-1">hrs</span></p>
              <p className={`text-xs mt-1 ${teamAgg.weeklySleepTrend === 'below_ideal' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {teamAgg.weeklySleepTrend === 'below_ideal' ? 'Below ideal' : 'Healthy range'}
              </p>
            </motion.div>
          </div>

          {/* Alert Queue + Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alert Queue */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1 glass-card p-5 flex flex-col max-h-[calc(100vh-220px)]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300 flex items-center gap-2">
                  <Bell size={16} />
                  Alert Queue
                </h3>
                <div className="flex items-center gap-2">
                  {alertCount.black > 0 && <span className="text-[10px] font-bold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-2 py-0.5 rounded-full">{alertCount.black}</span>}
                  {alertCount.red > 0 && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">{alertCount.red}</span>}
                  {alertCount.yellow > 0 && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-0.5 rounded-full">{alertCount.yellow}</span>}
                  <button
                    onClick={() => navigate('/coach/alerts')}
                    className="ml-1 text-[11px] font-medium text-accent-teal hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300 transition-colors flex items-center gap-0.5"
                  >
                    View all <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCheck size={20} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-pivot-600 dark:text-slate-300">All Clear</p>
                    <p className="text-xs text-pivot-400 dark:text-slate-500 mt-1">No active alerts</p>
                  </div>
                ) : (
                  activeAlerts.map((alert, i) => {
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: 0.1 * Math.min(i, 5) }}
                        className={`relative w-full text-left p-3 rounded-2xl border transition-all hover:shadow-glass cursor-pointer ${
                          alert.level === 'black' ? 'border-slate-800 dark:border-slate-300 bg-slate-50 dark:bg-slate-800/50' :
                          alert.level === 'red' ? 'border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10' :
                          'border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10'
                        }`}
                        onClick={() => setInterventionAlert(alert)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); const ath = athletes.find(a => a.id === alert.athleteId); if (ath) setSelectedAthlete(ath) }}
                            className="text-xs font-semibold text-pivot-700 dark:text-slate-200 hover:text-accent-teal transition-colors text-left"
                          >
                            {alert.athleteName}
                          </button>
                          <div className="flex items-center gap-1">
                            <AlertBadge level={alert.level} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === alert.id ? null : alert.id) }}
                              className="p-1 rounded-lg hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <MoreVertical size={14} className="text-pivot-400" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-pivot-500 dark:text-slate-400 mb-1">{alert.type}</p>
                        <p className="text-xs text-pivot-400 dark:text-slate-500">{alert.message}</p>
                        <p className="text-[10px] text-pivot-400 dark:text-slate-600 mt-1.5">{alert.time}</p>

                        {/* Action dropdown */}
                        <AnimatePresence>
                          {actionMenu === alert.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-2 top-10 z-20 glass-card p-1 shadow-xl rounded-xl border border-pivot-200 dark:border-slate-600 w-44"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDismissAlert(alert) }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              >
                                <CheckCheck size={14} className="text-emerald-500" /> Mark Addressed
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setActionMenu(null); setSelectedAthlete(athletes.find(a => a.id === alert.athleteId)) }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <MessageCircle size={14} className="text-accent-blue" /> View Athlete
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setActionMenu(null); navigate(`/coach/alerts?q=${encodeURIComponent(alert.athleteName)}`) }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <History size={14} className="text-pivot-500" /> View History
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>

            {/* Athlete Roster */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]"
            >
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3 shrink-0">
                Athlete Roster
              </h3>
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {filteredAthletes.map((athlete, i) => (
                  <motion.button
                    key={athlete.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setSelectedAthlete(athlete)}
                    className="w-full glass-card p-4 text-left flex items-center gap-4 transition-all hover:shadow-elevated group active:scale-[0.99]"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      athlete.status === 'urgent' ? 'bg-slate-800 dark:bg-slate-200' :
                      athlete.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20' :
                      athlete.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                      'bg-emerald-50 dark:bg-emerald-900/20'
                    }`}>
                      <span className={`text-sm font-bold ${
                        athlete.status === 'urgent' ? 'text-white dark:text-slate-900' :
                        athlete.status === 'danger' ? 'text-red-500' :
                        athlete.status === 'warning' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {athlete.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-pivot-900 dark:text-white">{athlete.name}</span>
                        <StatusPill status={athlete.status} />
                        {athlete.recovering && (
                          <span className="status-pill status-pill-warning text-[10px]">Recovering</span>
                        )}
                        {athlete.rhr && (
                          <span className="text-[10px] text-pivot-400 dark:text-slate-500">RHR {athlete.rhr}</span>
                        )}
                      </div>
                      <p className="text-xs text-pivot-400 dark:text-slate-500">
                        {athlete.school} · {athlete.position} · {athlete.height}cm / {athlete.weight}kg
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentHRV ?? athlete.hrv ?? '—'}</p>
                        <p className="text-pivot-400 dark:text-slate-500">HRV</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentRHR}</p>
                        <p className="text-pivot-400 dark:text-slate-500">RHR</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentSleep}h</p>
                        <p className="text-pivot-400 dark:text-slate-500">Sleep</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${(athlete.recentTrainingLoad || 0) >= 40 ? 'text-rose-500' : 'text-pivot-700 dark:text-slate-300'}`}>
                          {athlete.recentTrainingLoad ?? '—'}
                        </p>
                        <p className="text-pivot-400 dark:text-slate-500">Load</p>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-pivot-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Team Aggregate Chart — computed from real data */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <HealthTrendChart
              data={teamTrendData}
              title="Team Aggregate — 7 Day Trends (Computed from all athletes)"
              metrics={['hrv', 'rhr', 'sleepHours']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Team Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-5 border-l-4 border-l-accent-amber cursor-pointer hover:shadow-elevated transition-shadow"
            onClick={() => navigate('/coach/alerts')}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-pivot-700 dark:text-slate-300 mb-1">Crew Insight</p>
                <p className="text-sm text-pivot-600 dark:text-slate-400 leading-relaxed">
                  This week, the crew averaged {teamAgg.avgSleep} hours of sleep — <span className="text-amber-500 font-medium">below the ideal 7+ hours for NCAA training blocks</span>.
                  {teamAgg.atRiskCount} of {teamAgg.totalAthletes} athletes are showing signs of recovery deficiency.
                  Consider adjusting erg volume or scheduling a crew wellness check-in before the next water session.
                </p>
                <p className="text-xs text-accent-teal font-medium mt-2 hover:underline">View all alerts →</p>
              </div>
            </div>
          </motion.div>

          <div className="h-4" />
        </main>
      </div>

      {/* Athlete Detail Modal */}
      <AnimatePresence>
        {selectedAthlete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedAthlete(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedAthlete.status === 'urgent' ? 'bg-slate-800 dark:bg-slate-200' :
                    selectedAthlete.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20' :
                    selectedAthlete.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-emerald-50 dark:bg-emerald-900/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      selectedAthlete.status === 'urgent' ? 'text-white dark:text-slate-900' :
                      selectedAthlete.status === 'danger' ? 'text-red-500' :
                      selectedAthlete.status === 'warning' ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      {selectedAthlete.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-pivot-900 dark:text-white">{selectedAthlete.name}</h3>
                    <p className="text-xs text-pivot-400">{selectedAthlete.school} · {selectedAthlete.team}</p>
                    <p className="text-xs text-pivot-400">{selectedAthlete.position} · {selectedAthlete.height}cm / {selectedAthlete.weight}kg · Age {selectedAthlete.age}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAthlete(null)} className="p-2 rounded-xl hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors active:scale-90">
                  <XCircle size={20} className="text-pivot-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentHRV}</p>
                  <p className="text-[10px] text-pivot-400">HRV (ms)</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentRHR}</p>
                  <p className="text-[10px] text-pivot-400">RHR (bpm)</p>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentSleep}h</p>
                  <p className="text-[10px] text-pivot-400">Sleep</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 text-center">
                  <p className={`text-xl font-bold ${(selectedAthlete.recentTrainingLoad || 0) >= 40 ? 'text-rose-500' : 'text-pivot-900 dark:text-white'}`}>
                    {selectedAthlete.recentTrainingLoad ?? '—'}
                  </p>
                  <p className="text-[10px] text-pivot-400">7-Day Load</p>
                </div>
              </div>

              {selectedAthlete.latestTrainingType && (
                <div className="mb-4 flex items-center gap-2 text-xs text-pivot-500 dark:text-slate-400">
                  <Dumbbell size={14} className="text-indigo-500" />
                  <span>Latest: <span className="font-medium text-pivot-700 dark:text-slate-300">{selectedAthlete.latestTrainingType}</span></span>
                  {selectedAthlete.highLoadDays > 0 && (
                    <span className={`ml-2 ${selectedAthlete.highLoadDays >= 3 ? 'text-rose-500' : 'text-amber-500'}`}>
                      ({selectedAthlete.highLoadDays} high-load days this week)
                    </span>
                  )}
                </div>
              )}

              <HealthTrendChart data={selectedAthlete.health} title="Health Trends" metrics={['hrv', 'rhr', 'sleepHours']} darkMode={isDark} />

              {selectedAthlete.checkins[selectedAthlete.checkins.length - 1].journal && (
                <div className="mt-4 p-4 rounded-2xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs text-pivot-400 dark:text-slate-500 mb-1">Latest Journal</p>
                  <p className="text-sm text-pivot-700 dark:text-slate-200 italic">
                    "{selectedAthlete.checkins[selectedAthlete.checkins.length - 1].journal}"
                  </p>
                </div>
              )}

              {alerts.filter(a => a.athleteId === selectedAthlete.id).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-pivot-500 dark:text-slate-400">Active Alerts</p>
                  {alerts.filter(a => a.athleteId === selectedAthlete.id).map((alert, j) => (
                    <div key={j} className={`p-3 rounded-2xl border ${
                      alert.level === 'black' ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30' :
                      alert.level === 'red' ? 'border-red-200 dark:border-red-800/20 bg-red-50/50 dark:bg-red-900/10' :
                      'border-amber-200 dark:border-amber-800/20 bg-amber-50/50 dark:bg-amber-900/10'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertBadge level={alert.level} />
                        <span className="text-xs font-semibold text-pivot-700 dark:text-slate-200">{alert.type}</span>
                      </div>
                      <p className="text-xs text-pivot-500 dark:text-slate-400">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Modal */}
      {interventionAlert && (
        <InterventionModal
          alert={interventionAlert}
          athlete={athletes.find(a => a.id === interventionAlert.athleteId)}
          isOpen={!!interventionAlert}
          onClose={() => setInterventionAlert(null)}
          onDismiss={() => handleDismissAlert(interventionAlert)}
          onSendNudge={(suggestion) => handleSendNudge(interventionAlert, suggestion)}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} variant={toast.variant} />
    </div>
  )
}
