import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ClipboardCheck, Calendar, TrendingDown, Smile, Frown, Meh, Zap, BatteryLow, Loader2 } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import { isMockMode, apiListCheckins } from '../../config/api'
import { useAthleteData } from '../../context/AthleteDataContext'

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

function getMoodDotClass(mood) {
  if (mood >= 4) return 'bg-emerald-500'
  if (mood === 3) return 'bg-amber-500'
  return 'bg-rose-500'
}

function WeeklySummary({ checkins }) {
  const week = useMemo(() => checkins.slice(0, 7), [checkins])
  const avgMood = week.length ? Math.round(week.reduce((s, c) => s + c.mood, 0) / week.length * 10) / 10 : '-'
  const avgMotivation = week.length ? Math.round(week.reduce((s, c) => s + c.motivation, 0) / week.length * 10) / 10 : '-'
  const avgFatigue = week.length ? Math.round(week.reduce((s, c) => s + c.fatigue, 0) / week.length * 10) / 10 : '-'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="glass-card p-5"
    >
      <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-4">This Week</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-pivot-900 dark:text-white">{avgMood}</p>
          <p className="text-xs text-pivot-400 mt-1">Avg Mood /5</p>
          <div className="flex justify-center gap-0.5 mt-1.5">
            {week.map((c, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${getMoodDotClass(c.mood)}`} />
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-pivot-900 dark:text-white">{avgMotivation}</p>
          <p className="text-xs text-pivot-400 mt-1">Avg Motivation /10</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-pivot-900 dark:text-white">{avgFatigue}</p>
          <p className="text-xs text-pivot-400 mt-1">Avg Fatigue /10</p>
        </div>
      </div>
    </motion.div>
  )
}

function CheckinDetails({ checkin }) {
  return (
    <div className="px-4 pb-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
          <p className="text-xs text-pivot-400 mb-1">Mood</p>
          <div className="flex justify-center gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(n => (
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
    </div>
  )
}

function CheckinRow({ checkin, isExpanded, onToggle }) {
  const MoodIcon = getMoodIcon(checkin.mood)
  const moodColor = getMoodColor(checkin.mood)

  return (
    <div className="glass-card overflow-hidden will-change-transform">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-pivot-50 dark:hover:bg-slate-700/20 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-pivot-50 dark:bg-slate-700/30 flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-pivot-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-pivot-700 dark:text-slate-200">{checkin.day || checkin.date}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <MoodIcon size={14} className={moodColor} />
            <span className="text-xs text-pivot-400">Mood {checkin.mood}/5</span>
            <span className="text-xs text-pivot-300">·</span>
            <span className="text-xs text-pivot-400">Motivation {checkin.motivation}/10</span>
            <span className="text-xs text-pivot-300">·</span>
            <span className="text-xs text-pivot-400">Fatigue {checkin.fatigue}/10</span>
          </div>
        </div>
        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <TrendingDown size={14} className="text-pivot-300" />
        </div>
      </button>

      {isExpanded && (
        <div className="transition-all duration-200 ease-out">
          <CheckinDetails checkin={checkin} />
        </div>
      )}
    </div>
  )
}

export default function AthleteCheckinHistory() {
  const { checkins: cachedCheckins, bootstrapReady, bootstrap } = useAthleteData()
  const [expandedId, setExpandedId] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const parentRef = useRef(null)

  useEffect(() => {
    if (cachedCheckins.length > 0) {
      setCheckins(cachedCheckins)
      setHasMore(cachedCheckins.length >= 30)
    }
  }, [cachedCheckins])

  useEffect(() => {
    if (isMockMode() || bootstrapReady) return
    bootstrap()
  }, [bootstrap, bootstrapReady])

  const loading = !isMockMode() && !bootstrapReady && checkins.length === 0

  const rowVirtualizer = useVirtualizer({
    count: checkins.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 6,
  })

  const loadMore = async () => {
    if (loadingMore || !hasMore || isMockMode()) return
    setLoadingMore(true)
    try {
      const data = await apiListCheckins({ limit: 30, offset: checkins.length })
      const rows = (data?.checkins || []).map(c => ({
        ...c,
        day: c.date || c.day,
      }))
      if (rows.length === 0) {
        setHasMore(false)
      } else {
        setCheckins(prev => [...prev, ...rows])
        setHasMore(rows.length === 30)
      }
    } catch {
      // silent fail — user can retry by scrolling again
    } finally {
      setLoadingMore(false)
    }
  }

  const handleScroll = (e) => {
    const el = e.currentTarget
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) loadMore()
  }

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

          <WeeklySummary checkins={checkins} />

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider">
                Check-in Log
              </h3>
              <span className="text-xs text-pivot-400">{checkins.length} records loaded</span>
            </div>

            <div
              ref={parentRef}
              onScroll={handleScroll}
              className="h-[520px] overflow-auto rounded-2xl border border-pivot-100/50 dark:border-slate-700/30 pr-1"
            >
              <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const checkin = checkins[virtualItem.index]
                  return (
                    <div
                      key={checkin.id || checkin.day || virtualItem.key}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualItem.index}
                      className="absolute left-0 w-full px-1 py-1"
                      style={{ transform: `translateY(${virtualItem.start}px)` }}
                    >
                      <CheckinRow
                        checkin={checkin}
                        isExpanded={expandedId === (checkin.id || checkin.day)}
                        onToggle={() => {
                          const key = checkin.id || checkin.day
                          setExpandedId(expandedId === key ? null : key)
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {loadingMore && (
                <div className="py-4 flex justify-center text-pivot-400">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              {!hasMore && checkins.length > 0 && (
                <p className="py-4 text-center text-xs text-pivot-400">No more check-ins</p>
              )}
              {!isMockMode() && checkins.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-pivot-400 gap-2">
                  <ClipboardCheck size={28} />
                  <p className="text-sm">No check-ins yet</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="h-16 md:h-4" />
        </main>
      </div>
    </div>
  )
}
