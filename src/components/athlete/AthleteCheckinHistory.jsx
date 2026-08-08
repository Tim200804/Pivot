import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, Calendar, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, Zap, BatteryLow } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import { isMockMode, apiListCheckins } from '../../config/api'

const moodIcons = {
  high: Smile,
  medium: Meh,
  low: Frown,
}

function getMoodIcon(mood) {
  if (mood >= 4) return Smile
  if (mood === 3) return Meh
  return Frown
}

function getMoodColor(mood) {
  if (mood >= 4) return 'text-emerald-500'
  if (mood === 3) return 'text-amber-500'
  return 'text-rose-500'
}

export default function AthleteCheckinHistory() {
  const [expanded, setExpanded] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(!isMockMode())

  useEffect(() => {
    if (isMockMode()) return
    let cancelled = false
    setLoading(true)
    apiListCheckins({ limit: 90 })
      .then(data => {
        if (cancelled) return
        const rows = (data?.checkins || []).map(c => ({
          ...c,
          day: c.date || c.day,
        }))
        setCheckins(rows)
      })
      .catch(() => {
        if (!cancelled) setCheckins([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
        <Sidebar role="athlete" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-pivot-500 dark:text-slate-400">
            <div className="w-8 h-8 border-2 border-pivot-200 dark:border-slate-600 border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm">Loading check-in history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="athlete" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Daily Check-in History</h2>
            <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Track your subjective wellness over time</p>
          </motion.div>

          {/* Weekly Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-4">This Week</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-pivot-900 dark:text-white">
                  {checkins.length > 0 ? Math.round(checkins.slice(0, 7).reduce((s, c) => s + c.mood, 0) / Math.min(7, checkins.length) * 10) / 10 : '-'}
                </p>
                <p className="text-xs text-pivot-400 mt-1">Avg Mood /5</p>
                <div className="flex justify-center gap-0.5 mt-1.5">
                  {checkins.slice(0, 7).map((c, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${c.mood >= 4 ? 'bg-emerald-500' : c.mood === 3 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pivot-900 dark:text-white">
                  {checkins.length > 0 ? Math.round(checkins.slice(0, 7).reduce((s, c) => s + c.motivation, 0) / Math.min(7, checkins.length) * 10) / 10 : '-'}
                </p>
                <p className="text-xs text-pivot-400 mt-1">Avg Motivation /10</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pivot-900 dark:text-white">
                  {checkins.length > 0 ? Math.round(checkins.slice(0, 7).reduce((s, c) => s + c.fatigue, 0) / Math.min(7, checkins.length) * 10) / 10 : '-'}
                </p>
                <p className="text-xs text-pivot-400 mt-1">Avg Fatigue /10</p>
              </div>
            </div>
          </motion.div>

          {/* History List */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Check-in Log
            </h3>
            <div className="space-y-2">
              {checkins.map((checkin, i) => {
                const MoodIcon = getMoodIcon(checkin.mood)
                const moodColor = getMoodColor(checkin.mood)
                const isExpanded = expanded === i

                return (
                  <motion.div
                    key={checkin.id || checkin.day || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className="glass-card overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : i)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-pivot-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-pivot-50 dark:bg-slate-700/30 flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-pivot-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-pivot-700 dark:text-slate-200">{checkin.day || checkin.date}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MoodIcon size={14} className={moodColor} />
                          <span className="text-xs text-pivot-400">Mood {checkin.mood}/5</span>
                          <span className="text-xs text-pivot-300">·</span>
                          <span className="text-xs text-pivot-400">Motivation {checkin.motivation}/10</span>
                          <span className="text-xs text-pivot-300">·</span>
                          <span className="text-xs text-pivot-400">Fatigue {checkin.fatigue}/10</span>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <TrendingDown size={14} className="text-pivot-300" />
                      </motion.div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-3"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
                            <p className="text-xs text-pivot-400 mb-1">Mood</p>
                            <div className="flex justify-center gap-0.5 mb-1">
                              {[1,2,3,4,5].map(n => (
                                <div key={n} className={`w-3 h-1.5 rounded-full ${n <= checkin.mood ? 'bg-accent-blue' : 'bg-pivot-200 dark:bg-slate-600'}`} />
                              ))}
                            </div>
                            <p className="text-lg font-bold text-pivot-900 dark:text-white">{checkin.mood}/5</p>
                          </div>
                          <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
                            <p className="text-xs text-pivot-400 mb-1">Motivation</p>
                            <div className="w-full h-1.5 rounded-full bg-pivot-200 dark:bg-slate-600 overflow-hidden mb-1">
                              <div className="h-full bg-accent-blue rounded-full" style={{ width: `${checkin.motivation * 10}%` }} />
                            </div>
                            <p className="text-lg font-bold text-pivot-900 dark:text-white">{checkin.motivation}/10</p>
                          </div>
                          <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
                            <p className="text-xs text-pivot-400 mb-1">Fatigue</p>
                            <div className="w-full h-1.5 rounded-full bg-pivot-200 dark:bg-slate-600 overflow-hidden mb-1">
                              <div className="h-full bg-rose-400 rounded-full" style={{ width: `${checkin.fatigue * 10}%` }} />
                            </div>
                            <p className="text-lg font-bold text-pivot-900 dark:text-white">{checkin.fatigue}/10</p>
                          </div>
                        </div>
                        {checkin.journal && (
                          <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                            <p className="text-xs text-pivot-400 mb-1">Journal</p>
                            <p className="text-sm text-pivot-700 dark:text-slate-200 italic">"{checkin.journal}"</p>
                          </div>
                        )}
                        {checkin.challenge !== 'none' && (
                          <div className="flex items-center gap-2 text-xs">
                            {checkin.challenge === 'mental_fatigue' ? <BatteryLow size={14} className="text-amber-500" /> : <Zap size={14} className="text-rose-500" />}
                            <span className="text-pivot-500 dark:text-slate-400 capitalize">{checkin.challenge?.replace('_', ' ')} detected</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <div className="h-16 md:h-4" />
        </main>
      </div>
    </div>
  )
}
