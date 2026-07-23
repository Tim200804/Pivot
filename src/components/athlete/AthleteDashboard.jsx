import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Moon, Activity, Droplets, TrendingUp,
  ClipboardCheck, Bell, Menu, X, Sun,
  GraduationCap, Users, Ruler, Weight, Anchor,
  CheckCircle2, MessageCircle
} from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import MetricCard from '../ui/MetricCard'
import AlertBadge from '../ui/AlertBadge'
import HealthTrendChart from '../ui/HealthTrendChart'
import AICoachInsight from '../ui/AICoachInsight'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { useAlerts } from '../../context/AlertContext'
import { useMoodColors } from '../../context/MoodColorContext'
import { ATHLETES } from '../../data/mockData'

const DEMO_ATHLETE = ATHLETES[2]

const Toast = memo(function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl text-sm font-medium will-change-transform"
        >
          <CheckCircle2 size={18} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default function AthleteDashboard() {
  const { theme } = useTheme()
  const { user } = useUser()
  const { palette } = useMoodColors()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const trendsRef = useRef(null)
  const checkinRef = useRef(null)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const athlete = DEMO_ATHLETE
  const latestHealth = useMemo(() => athlete.health[athlete.health.length - 1], [athlete])
  const latestCheckin = useMemo(() => athlete.checkins[athlete.checkins.length - 1], [athlete])
  const { alerts, totalAlerts, activeNudgesForAthlete, respondToNudge } = useAlerts()
  const myAlerts = useMemo(() => alerts.filter(a => a.athleteId === athlete.id), [alerts, athlete.id])
  const pendingNudges = useMemo(() => activeNudgesForAthlete(athlete.id), [activeNudgesForAthlete, athlete.id])

  // Interactive check-in state — starts with latest values but user can change
  const [checkinForm, setCheckinForm] = useState({
    mood: latestCheckin.mood,
    motivation: latestCheckin.motivation,
    fatigue: latestCheckin.fatigue,
    journal: latestCheckin.journal || '',
  })

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }, [])

  const handleSaveCheckin = useCallback(() => {
    pendingNudges.forEach(nudge => {
      respondToNudge(nudge.id, checkinForm)
    })
    const nudgeCount = pendingNudges.length
    if (nudgeCount > 0) {
      showToast(`Check-in saved! Your coach received your response to ${nudgeCount} nudge${nudgeCount > 1 ? 's' : ''}.`)
    } else {
      showToast('Check-in saved! Your coach has been notified.')
    }
  }, [pendingNudges, respondToNudge, checkinForm, showToast])

  const morningSummary = useMemo(() => {
    const hrvChange = Math.abs(Math.round((athlete.health[6].hrv - athlete.health[5].hrv) / athlete.health[5].hrv * 100))
    if (athlete.status === 'danger' || athlete.status === 'urgent') {
      return `Your HRV has declined ${hrvChange}% over the past day and has been trending down for 3+ days. We strongly recommend focusing on recovery today. Consider talking to your coach.`
    }
    const hrvTrend = athlete.health[5].hrv < athlete.health[6].hrv ? 'up' : 'down'
    return `Last night you slept ${latestHealth.sleepHours} hours. Your HRV is ${hrvTrend} ${hrvChange}% from yesterday. Recovery status: ${athlete.hrvTrend === 'improving' ? 'improving' : 'needs attention'}.`
  }, [athlete, latestHealth])

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="athlete" />

      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        {/* Mobile header */}
        <header className="md:hidden glass-card rounded-none border-b border-pivot-100/60 dark:border-slate-700/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#0a1050]/90 flex items-center justify-center overflow-hidden">
              <img src="/pivot-logo.png" alt="Pivot Logo" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="font-bold text-pivot-900 dark:text-white">Pivot</h1>
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
                <Activity size={20} /> Dashboard
              </button>
              <button onClick={() => { setMobileMenuOpen(false); setShowCheckin(true); checkinRef.current?.scrollIntoView({ behavior: 'smooth' }) }} className="sidebar-link sidebar-link-inactive w-full">
                <ClipboardCheck size={20} /> Daily Check-in
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/athlete/trends') }} className="sidebar-link sidebar-link-inactive w-full">
                <TrendingUp size={20} /> Trends
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/athlete/alerts') }} className="sidebar-link sidebar-link-inactive w-full">
                <Bell size={20} /> Alerts
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
          {/* Pending Nudge from Coach */}
          {pendingNudges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border-l-4 border-l-accent-blue bg-blue-50/30 dark:bg-blue-900/10"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} className="text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-pivot-900 dark:text-white mb-1">
                    Message from your coach
                  </p>
                  <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed">
                    {pendingNudges[0].message}
                  </p>
                  <p className="text-xs text-accent-blue font-medium mt-2">
                    {pendingNudges[0].checkInPrompt}
                  </p>
                </div>
                <button
                  onClick={() => { setShowCheckin(true); checkinRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-semibold hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  Respond
                </button>
              </div>
            </motion.div>
          )}

          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4"
          >
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight truncate">
                Morning, {user?.name || athlete.name}
              </h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.accent }} />
                <span className="text-[11px] font-medium" style={{ color: palette.accent }}>
                  {palette.label}
                </span>
                <span className="text-[11px] text-pivot-400 dark:text-slate-500">
                  · {palette.description}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/athlete/alerts')}
              className="relative p-3 rounded-2xl border transition-all hover:shadow-glass active:scale-95"
              style={{
                borderColor: totalAlerts > 0 ? palette.accentBorder : undefined,
                backgroundColor: totalAlerts > 0 ? palette.bgAccent : undefined,
              }}
            >
              <Bell size={20} className={totalAlerts > 0 ? '' : 'text-pivot-400'} style={{ color: totalAlerts > 0 ? palette.accent : undefined }} />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
                  style={{ background: palette.gradient }}>
                  {totalAlerts}
                </span>
              )}
            </button>
          </motion.div>

          {/* Profile Card */}
          {(user?.school || user?.teamName) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {user.school && (
                  <div className="flex items-center gap-1.5 text-xs text-pivot-600 dark:text-slate-300">
                    <GraduationCap size={14} className="text-pivot-400 shrink-0" />
                    <span className="font-medium">{user.school}</span>
                  </div>
                )}
                {user.teamName && (
                  <div className="flex items-center gap-1.5 text-xs text-pivot-600 dark:text-slate-300">
                    <Users size={14} className="text-pivot-400 shrink-0" />
                    <span>{user.teamName}</span>
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center gap-1.5 text-xs text-accent-blue dark:text-blue-400 font-semibold">
                    <Anchor size={14} className="shrink-0" />
                    <span>{user.position}</span>
                  </div>
                )}
                {user.height && (
                  <div className="flex items-center gap-1.5 text-xs text-pivot-600 dark:text-slate-300">
                    <Ruler size={14} className="text-pivot-400 shrink-0" />
                    <span>{user.height} cm</span>
                  </div>
                )}
                {user.weight && (
                  <div className="flex items-center gap-1.5 text-xs text-pivot-600 dark:text-slate-300">
                    <Weight size={14} className="text-pivot-400 shrink-0" />
                    <span>{user.weight} kg</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Morning Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card p-5 border-l-4 ${
              athlete.status === 'danger' || athlete.status === 'urgent'
                ? 'border-l-red-500'
                : athlete.status === 'warning'
                ? 'border-l-amber-500'
                : 'border-l-emerald-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                athlete.status === 'danger' || athlete.status === 'urgent'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : athlete.status === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'bg-emerald-50 dark:bg-emerald-900/20'
              }`}>
                <Sun size={20} className={
                  athlete.status === 'danger' || athlete.status === 'urgent' ? 'text-red-500' :
                  athlete.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                } />
              </div>
              <div>
                <h3 className="font-semibold text-pivot-900 dark:text-white text-sm mb-1">Today's Summary</h3>
                <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed">{morningSummary}</p>
                {myAlerts.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {myAlerts.map((alert, i) => (
                      <AlertBadge key={i} level={alert.level} />
                    ))}
                    <button
                      onClick={() => navigate('/athlete/alerts')}
                      className="text-xs text-accent-blue hover:underline self-center font-medium"
                    >
                      View all {myAlerts.length} alert{myAlerts.length > 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI Coach Insight */}
          <AICoachInsight athlete={athlete} checkin={checkinForm} />

          {/* Health Metrics Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider">
                Health Metrics
              </h3>
              <button
                onClick={() => navigate('/athlete/trends')}
                className="text-[11px] text-accent-blue hover:underline font-medium flex items-center gap-1"
              >
                <TrendingUp size={12} /> View Trends
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <MetricCard
                  icon={Heart}
                  label="Heart Rate Variability"
                  value={latestHealth.hrv}
                  unit="ms"
                  trend={athlete.hrvTrend === 'improving' ? 'up' : 'down'}
                  trendValue={`${Math.abs(Math.round((latestHealth.hrv - athlete.health[5].hrv) / athlete.health[5].hrv * 100))}%`}
                  color={athlete.status === 'danger' || athlete.status === 'urgent' ? 'rose' : 'blue'}
                  onClick={() => trendsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <MetricCard
                  icon={Activity}
                  label="Resting Heart Rate"
                  value={latestHealth.rhr}
                  unit="bpm"
                  trend={latestHealth.rhr > athlete.health[5].rhr ? 'up' : 'down'}
                  trendValue={Math.abs(latestHealth.rhr - athlete.health[5].rhr)}
                  color="rose"
                  onClick={() => trendsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <MetricCard
                  icon={Moon}
                  label="Sleep Duration"
                  value={latestHealth.sleepHours}
                  unit="hrs"
                  trend={latestHealth.sleepHours < 6 ? 'down' : 'up'}
                  trendValue={`${latestHealth.sleepHours < 7 ? 'Below ideal' : 'Good'}`}
                  color={latestHealth.sleepHours < 6 ? 'amber' : 'teal'}
                  onClick={() => trendsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <MetricCard
                  icon={Droplets}
                  label="Blood Oxygen"
                  value={latestHealth.spo2}
                  unit="%"
                  trend="stable"
                  trendValue="Normal"
                  color="teal"
                  onClick={() => trendsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                />
              </motion.div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={trendsRef}>
            {/* Health Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2"
            >
              <HealthTrendChart
                data={athlete.health}
                title="7-Day Health Trends"
                metrics={['hrv', 'rhr', 'sleepHours']}
                darkMode={isDark}
              />
            </motion.div>

            {/* Interactive Check-in Panel */}
            <motion.div
              ref={checkinRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Today's Check-in</h3>
                <button
                  onClick={() => setShowCheckin(!showCheckin)}
                  className="text-xs text-accent-blue font-medium hover:underline"
                >
                  {showCheckin ? 'Close' : 'Update'}
                </button>
              </div>

              {showCheckin ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                  {/* Interactive Mood */}
                  <div>
                    <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-1">
                      Mood <span className="text-pivot-400 font-normal">— {checkinForm.mood}/5</span>
                    </label>
                    <div className="flex gap-1.5">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          onClick={() => setCheckinForm(prev => ({ ...prev, mood: n }))}
                          className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all active:scale-90 ${
                            n === checkinForm.mood
                              ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-blue-500/20'
                              : 'border-pivot-200 dark:border-slate-600 text-pivot-400 hover:border-accent-blue/50 hover:text-accent-blue'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Motivation */}
                  <div>
                    <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-1">
                      Motivation <span className="text-pivot-400 font-normal">— {checkinForm.motivation}/10</span>
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button
                          key={n}
                          onClick={() => setCheckinForm(prev => ({ ...prev, motivation: n }))}
                          className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all active:scale-90 ${
                            n === checkinForm.motivation
                              ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-blue-500/20'
                              : 'border-pivot-200 dark:border-slate-600 text-pivot-400 hover:border-accent-blue/50 hover:text-accent-blue'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Fatigue */}
                  <div>
                    <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-1">
                      Fatigue <span className="text-pivot-400 font-normal">— {checkinForm.fatigue}/10</span>
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button
                          key={n}
                          onClick={() => setCheckinForm(prev => ({ ...prev, fatigue: n }))}
                          className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all active:scale-90 ${
                            n === checkinForm.fatigue
                              ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-blue-500/20'
                              : 'border-pivot-200 dark:border-slate-600 text-pivot-400 hover:border-accent-blue/50 hover:text-accent-blue'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={checkinForm.journal}
                    onChange={e => setCheckinForm(prev => ({ ...prev, journal: e.target.value }))}
                    placeholder="Anything on your mind today?"
                    className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 resize-none h-20 focus:ring-2 focus:ring-accent-blue/40 focus:outline-none transition-all"
                  />

                  <button
                    onClick={handleSaveCheckin}
                    className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 transition-all active:scale-[0.97] shadow-lg shadow-blue-500/20"
                  >
                    Save Check-in
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-pivot-500 dark:text-slate-400">Mood</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-4 h-1.5 rounded-full transition-all ${n <= checkinForm.mood ? 'bg-accent-blue' : 'bg-pivot-200 dark:bg-slate-600'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-pivot-700 dark:text-slate-300">{checkinForm.mood}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-pivot-500 dark:text-slate-400">Motivation</span>
                    <div className="flex-1 mx-3 h-1.5 rounded-full bg-pivot-200 dark:bg-slate-600 overflow-hidden">
                      <div className="h-full bg-accent-blue rounded-full transition-all" style={{ width: `${checkinForm.motivation * 10}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-pivot-700 dark:text-slate-300">{checkinForm.motivation}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-pivot-500 dark:text-slate-400">Fatigue</span>
                    <div className="flex-1 mx-3 h-1.5 rounded-full bg-pivot-200 dark:bg-slate-600 overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${checkinForm.fatigue * 10}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-pivot-700 dark:text-slate-300">{checkinForm.fatigue}/10</span>
                  </div>
                  {(checkinForm.journal || latestCheckin.journal) && (
                    <div className="pt-3 border-t border-pivot-100 dark:border-slate-700">
                      <p className="text-xs text-pivot-500 dark:text-slate-400 italic">
                        "{checkinForm.journal || latestCheckin.journal}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Low Period Support Module */}
          {(athlete.status === 'danger' || athlete.status === 'urgent') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glass-card p-6 border-l-4 border-l-accent-amber"
            >
              <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300 mb-4">
                Low Period Support
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-semibold text-accent-blue mb-2">You're Not Alone</p>
                  <p className="text-2xl font-bold text-pivot-900 dark:text-white mb-1">44%</p>
                  <p className="text-xs text-pivot-500 dark:text-slate-400 leading-relaxed">
                    of student-athletes report mental health symptoms. What you're feeling is common — and temporary.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/20 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-semibold text-accent-teal mb-2">You've Come Back Before</p>
                  <p className="text-2xl font-bold text-pivot-900 dark:text-white mb-1">3 times</p>
                  <p className="text-xs text-pivot-500 dark:text-slate-400 leading-relaxed">
                    Your data shows you've navigated through similar low periods before. Your average recovery: 5 days.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">What You Can Do Now</p>
                  <ul className="space-y-2 text-xs text-pivot-500 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      Consider a lighter erg day — recovery rows are part of training
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      Try 5 minutes of box breathing (4-4-4-4) before bed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      Reach out to your coxswain or coach — you don't have to carry this alone
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Data Cross-Validation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300 mb-4">
              Data Cross-Validation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-pivot-50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-pivot-500 dark:text-slate-400 mb-1">Objective Data</p>
                <p className="text-sm text-pivot-700 dark:text-slate-200">
                  HRV: {latestHealth.hrv}ms (↓) | Sleep: {latestHealth.sleepHours}h | RHR: {latestHealth.rhr} bpm (↑)
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-pivot-50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-pivot-500 dark:text-slate-400 mb-1">Subjective Data</p>
                <p className="text-sm text-pivot-700 dark:text-slate-200">
                  Mood: {checkinForm.mood}/5 | Motivation: {checkinForm.motivation}/10 | Fatigue: {checkinForm.fatigue}/10
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Coach Insight</p>
              <p className="text-sm text-pivot-600 dark:text-slate-300">
                See personalized insight above
              </p>
            </div>
          </motion.div>

          {/* Training Data */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <HealthTrendChart
              data={athlete.training}
              title="Training Load — 7 Days"
              metrics={['distance', 'avgSplit']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Extra bottom padding for mobile nav */}
          <div className="h-24 md:h-0" />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-pivot-100/60 dark:border-slate-700/40 px-2 py-2 flex justify-around z-50" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
          {[
            { icon: Activity, label: 'Dashboard', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { icon: ClipboardCheck, label: 'Check-in', onClick: () => { setShowCheckin(true); checkinRef.current?.scrollIntoView({ behavior: 'smooth' }) } },
            { icon: TrendingUp, label: 'Trends', onClick: () => navigate('/athlete/trends') },
            { icon: Bell, label: 'Alerts', badge: totalAlerts, onClick: () => navigate('/athlete/alerts') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors text-pivot-400 dark:text-slate-500 hover:text-accent-blue active:scale-90"
            >
              <div className="relative">
                <item.icon size={20} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
