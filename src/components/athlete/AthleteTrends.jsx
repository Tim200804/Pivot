import { motion } from 'framer-motion'
import { TrendingUp, Activity, Heart, Moon, BarChart3 } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import HealthTrendChart from '../ui/HealthTrendChart'
import { useTheme } from '../../context/ThemeContext'
import { ATHLETES } from '../../data/mockData'

const DEMO_ATHLETE = ATHLETES[2] // Morgan

export default function AthleteTrends() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="athlete" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Health Trends</h2>
            <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Long-term analysis of your biometric data</p>
          </motion.div>

          {/* Health Trends */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <HealthTrendChart
              data={DEMO_ATHLETE.health}
              title="7-Day Health Trends — HRV, RHR, Sleep"
              metrics={['hrv', 'rhr', 'sleepHours']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Training Trends */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <HealthTrendChart
              data={DEMO_ATHLETE.training}
              title="7-Day Training Load"
              metrics={['distance', 'avgSplit']}
              darkMode={isDark}
            />
          </motion.div>

          {/* Trend Analysis Cards */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-accent-blue" />
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Trend Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-rose-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">HRV 7-Day Trend</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-500">↓ Declining</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-amber-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">RHR 7-Day Trend</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-500">↑ Rising</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Moon size={14} className="text-rose-500" />
                    <span className="text-xs text-pivot-600 dark:text-slate-300">Sleep 7-Day Trend</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-500">↓ Declining</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-accent-teal" />
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Recovery Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-pivot-900 dark:text-white mb-1">Recovery State</p>
                  <p className="text-xs text-pivot-500 dark:text-slate-400">Below baseline — accumulated fatigue detected</p>
                </div>
                <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-pivot-900 dark:text-white mb-1">Recommended Action</p>
                  <p className="text-xs text-pivot-500 dark:text-slate-400">Reduce training intensity by 20-30% for 2-3 days to allow recovery</p>
                </div>
                <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-pivot-900 dark:text-white mb-1">Estimated Return to Baseline</p>
                  <p className="text-xs text-pivot-500 dark:text-slate-400">~5 days with proper rest and nutrition</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="h-16 md:h-4" />
        </main>
      </div>
    </div>
  )
}
