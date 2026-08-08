import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Activity, Heart, Moon, BarChart3, Dumbbell } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import HealthTrendChart from '../ui/HealthTrendChart'
import TrainingImpactChart from '../ui/TrainingImpactChart'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { isMockMode, apiGetHealthMetrics, apiGetTrainingMetrics, apiGetTrainingCorrelation, apiGetTrainingSuggestion } from '../../config/api'

const RANGE_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '180d', label: '6 Months' },
]

function lerp(a, b, t) { return a + (b - a) * t }

function generateRangeData(athlete, range) {
  const h7 = athlete.health || []
  const t7 = athlete.training || []

  // If we don't have enough real data, fall back to 7-day view
  if (range === '7d' || h7.length < 7) {
    return {
      health: h7,
      training: t7,
      labelPrefix: '7-Day',
      trendLabel: '7-Day',
    }
  }

  // Healthy baseline (Day 0 — before decline)
  const baseH = { hrv: 58, rhr: 54, sleepHours: 7.2, sleepDeep: 20, sleepREM: 24, spo2: 97.5, respiratoryRate: 14.2, skinTemp: 36.4 }
  const baseT = { distance: 8200, avgSplit: 112, avgSPM: 28, maxHR: 170, avgHR: 145, duration: 48 }

  if (range === '30d') {
    const health = []
    const training = []
    // Day 1-23: interpolate from healthy baseline to h7[0]
    for (let i = 0; i < 23; i++) {
      const t = i / 22
      health.push({
        day: `Jul ${i + 1}`,
        hrv: Math.round(lerp(baseH.hrv, h7[0].hrv, t) * 10) / 10,
        rhr: Math.round(lerp(baseH.rhr, h7[0].rhr, t)),
        sleepHours: Math.round(lerp(baseH.sleepHours, h7[0].sleepHours, t) * 10) / 10,
        sleepDeep: Math.round(lerp(baseH.sleepDeep, h7[0].sleepDeep, t)),
        sleepREM: Math.round(lerp(baseH.sleepREM, h7[0].sleepREM, t)),
        spo2: Math.round(lerp(baseH.spo2, h7[0].spo2, t) * 10) / 10,
        respiratoryRate: Math.round(lerp(baseH.respiratoryRate, h7[0].respiratoryRate, t) * 10) / 10,
        skinTemp: Math.round(lerp(baseH.skinTemp, h7[0].skinTemp, t) * 10) / 10,
      })
      training.push({
        day: `Jul ${i + 1}`,
        distance: Math.round(lerp(baseT.distance, t7[0].distance, t)),
        avgSplit: Math.round(lerp(baseT.avgSplit, t7[0].avgSplit, t) * 10) / 10,
        avgSPM: Math.round(lerp(baseT.avgSPM, t7[0].avgSPM, t)),
        maxHR: Math.round(lerp(baseT.maxHR, t7[0].maxHR, t)),
        avgHR: Math.round(lerp(baseT.avgHR, t7[0].avgHR, t)),
        duration: Math.round(lerp(baseT.duration, t7[0].duration, t)),
      })
    }
    // Day 24-30: actual Morgan data
    for (let i = 0; i < 7; i++) {
      health.push({ ...h7[i], day: `Jul ${i + 24}` })
      training.push({ ...t7[i], day: `Jul ${i + 24}` })
    }
    return { health, training, labelPrefix: '30-Day', trendLabel: '30-Day' }
  }

  // 180d — 30 points, every 6 days
  const health = []
  const training = []
  for (let i = 0; i < 24; i++) {
    const jitter = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 1.5
    health.push({
      day: `Jun ${i * 6 + 1}`,
      hrv: Math.round((56 + jitter) * 10) / 10,
      rhr: Math.round(55 + jitter * 0.5),
      sleepHours: Math.round((7.0 + jitter * 0.15) * 10) / 10,
      sleepDeep: Math.round(19 + jitter * 0.8),
      sleepREM: Math.round(23 + jitter * 0.6),
      spo2: Math.round((97.2 + jitter * 0.15) * 10) / 10,
      respiratoryRate: Math.round((14.5 + jitter * 0.2) * 10) / 10,
      skinTemp: Math.round((36.5 + jitter * 0.08) * 10) / 10,
    })
    training.push({
      day: `Jun ${i * 6 + 1}`,
      distance: Math.round(8000 + jitter * 400),
      avgSplit: Math.round((113 + jitter * 0.4) * 10) / 10,
      avgSPM: Math.round(28 + jitter * 0.2),
      maxHR: Math.round(170 + jitter * 2),
      avgHR: Math.round(146 + jitter * 1.5),
      duration: Math.round(46 + jitter * 2),
    })
  }
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    health.push({
      day: `Jul ${i * 6 + 1}`,
      hrv: Math.round(lerp(h7[0].hrv, h7[6].hrv, t) * 10) / 10,
      rhr: Math.round(lerp(h7[0].rhr, h7[6].rhr, t)),
      sleepHours: Math.round(lerp(h7[0].sleepHours, h7[6].sleepHours, t) * 10) / 10,
      sleepDeep: Math.round(lerp(h7[0].sleepDeep, h7[6].sleepDeep, t)),
      sleepREM: Math.round(lerp(h7[0].sleepREM, h7[6].sleepREM, t)),
      spo2: Math.round(lerp(h7[0].spo2, h7[6].spo2, t) * 10) / 10,
      respiratoryRate: Math.round(lerp(h7[0].respiratoryRate, h7[6].respiratoryRate, t) * 10) / 10,
      skinTemp: Math.round(lerp(h7[0].skinTemp, h7[6].skinTemp, t) * 10) / 10,
    })
    training.push({
      day: `Jul ${i * 6 + 1}`,
      distance: Math.round(lerp(t7[0].distance, t7[6].distance, t)),
      avgSplit: Math.round(lerp(t7[0].avgSplit, t7[6].avgSplit, t) * 10) / 10,
      avgSPM: Math.round(lerp(t7[0].avgSPM, t7[6].avgSPM, t)),
      maxHR: Math.round(lerp(t7[0].maxHR, t7[6].maxHR, t)),
      avgHR: Math.round(lerp(t7[0].avgHR, t7[6].avgHR, t)),
      duration: Math.round(lerp(t7[0].duration, t7[6].duration, t)),
    })
  }
  return { health, training, labelPrefix: '6-Month', trendLabel: '6-Month' }
}

export default function AthleteTrends() {
  const { theme } = useTheme()
  const { user } = useUser()
  const isDark = theme === 'dark'
  const [timeRange, setTimeRange] = useState('7d')
  const [healthRows, setHealthRows] = useState([])
  const [trainingRows, setTrainingRows] = useState([])
  const [correlation, setCorrelation] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [loading, setLoading] = useState(!isMockMode())

  useEffect(() => {
    if (isMockMode() || !user?.id) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      apiGetHealthMetrics(user.id, { limit: 180 }),
      apiGetTrainingMetrics(user.id, { limit: 180 }),
      apiGetTrainingCorrelation(user.id, { days: 28 }).catch(() => null),
    ])
      .then(([healthRes, trainingRes, correlationRes]) => {
        if (cancelled) return
        const h = (healthRes?.metrics || []).map(r => ({ ...r, day: r.day || r.date })).reverse()
        const t = (trainingRes?.metrics || []).map(r => ({ ...r, day: r.day || r.date })).reverse()
        setHealthRows(h)
        setTrainingRows(t)
        setCorrelation(correlationRes?.correlation || null)

        // Load AI-style training adjustment suggestion in parallel
        setSuggestionLoading(true)
        apiGetTrainingSuggestion(user.id, { days: 14 })
          .then(res => { if (!cancelled) setSuggestion(res?.suggestion || null) })
          .catch(() => { if (!cancelled) setSuggestion(null) })
          .finally(() => { if (!cancelled) setSuggestionLoading(false) })
      })
      .catch(() => {
        if (!cancelled) {
          setHealthRows([])
          setTrainingRows([])
          setCorrelation(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id])

  const data = useMemo(() => generateRangeData({ health: healthRows, training: trainingRows }, timeRange), [healthRows, trainingRows, timeRange])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
        <Sidebar role="athlete" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-pivot-500 dark:text-slate-400">
            <div className="w-8 h-8 border-2 border-pivot-200 dark:border-slate-600 border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm">Loading trends...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="athlete" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-6">
          {/* Header with time-range selector */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Health Trends</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Long-term analysis of your biometric data</p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-pivot-50 dark:bg-slate-800/50 border border-pivot-100 dark:border-slate-700/30">
              {RANGE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    timeRange === value
                      ? 'bg-white dark:bg-slate-700 text-pivot-900 dark:text-white shadow-sm'
                      : 'text-pivot-400 dark:text-slate-400 hover:text-pivot-600 dark:hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Health Trends */}
          <motion.div
            key={`health-${timeRange}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HealthTrendChart
              data={data.health}
              title={`${data.labelPrefix} Health Trends — HRV, RHR, Sleep`}
              metrics={['hrv', 'rhr', 'sleepHours']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Training Load Overlay */}
          <motion.div
            key={`impact-${timeRange}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TrainingImpactChart
              healthData={data.health}
              trainingData={data.training}
              title={`${data.labelPrefix} Training Load vs Recovery`}
              darkMode={isDark}
            />
          </motion.div>

          {/* Training Trends */}
          <motion.div
            key={`training-${timeRange}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <HealthTrendChart
              data={data.training}
              title={`${data.labelPrefix} Training Load`}
              metrics={['distance', 'avgSplit']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Trend Analysis Cards */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={16} className="text-accent-blue" />
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Training-Recovery Correlation</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-rose-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">Load vs HRV</span>
                  </div>
                  <span className={`text-xs font-semibold ${correlation?.correlations?.loadVsHrv != null ? (correlation.correlations.loadVsHrv < -0.3 ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-400'}`}>
                    {correlation?.correlations?.loadVsHrv != null ? correlation.correlations.loadVsHrv.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-amber-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">Load vs RHR</span>
                  </div>
                  <span className={`text-xs font-semibold ${correlation?.correlations?.loadVsRhr != null ? (correlation.correlations.loadVsRhr > 0.3 ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-400'}`}>
                    {correlation?.correlations?.loadVsRhr != null ? correlation.correlations.loadVsRhr.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Moon size={14} className="text-indigo-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">Load vs Sleep</span>
                  </div>
                  <span className={`text-xs font-semibold ${correlation?.correlations?.loadVsSleep != null ? (correlation.correlations.loadVsSleep < -0.3 ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-400'}`}>
                    {correlation?.correlations?.loadVsSleep != null ? correlation.correlations.loadVsSleep.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent-teal" />
                  <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">AI Training Adjustment</h3>
                </div>
                {suggestion?.riskLevel && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    suggestion.riskLevel === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
                    suggestion.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  }`}>
                    {suggestion.riskLevel} risk
                  </span>
                )}
              </div>
              {suggestionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-pivot-200 dark:border-slate-600 border-t-accent-teal rounded-full animate-spin" />
                </div>
              ) : suggestion?.hasEnoughData === false ? (
                <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs text-pivot-500 dark:text-slate-400">{suggestion.suggestion}</p>
                </div>
              ) : suggestion ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-accent-teal/5 dark:bg-teal-900/10 border border-accent-teal/10 dark:border-teal-800/30">
                    <p className="text-xs font-medium text-pivot-900 dark:text-white mb-1">Suggestion</p>
                    <p className="text-xs text-pivot-600 dark:text-slate-300 leading-relaxed">{suggestion.suggestion}</p>
                  </div>
                  {suggestion.actions?.length > 0 && (
                    <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                      <p className="text-xs font-medium text-pivot-900 dark:text-white mb-1.5">Recommended Actions</p>
                      <ul className="space-y-1.5">
                        {suggestion.actions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-pivot-600 dark:text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-accent-teal mt-1.5 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {suggestion.metrics && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
                        <p className="text-xs font-semibold text-pivot-900 dark:text-white">{suggestion.metrics.recentLoad}</p>
                        <p className="text-[10px] text-pivot-400">Recent Load</p>
                      </div>
                      <div className="p-2 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-center">
                        <p className={`text-xs font-semibold ${suggestion.metrics.hrvDeltaPct < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {suggestion.metrics.hrvDeltaPct > 0 ? '+' : ''}{suggestion.metrics.hrvDeltaPct}%
                        </p>
                        <p className="text-[10px] text-pivot-400">HRV Δ</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs text-pivot-500 dark:text-slate-400">No training suggestion available.</p>
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
