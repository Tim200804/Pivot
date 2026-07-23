import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Shield, Info, ChevronRight, CheckCircle2, Eye } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge from '../ui/AlertBadge'
import { useAlerts } from '../../context/AlertContext'
import { useMoodColors } from '../../context/MoodColorContext'

function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl text-sm font-medium"
        >
          <CheckCircle2 size={18} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AthleteAlertCenter() {
  const { alerts, athletes } = useAlerts()
  const { palette } = useMoodColors()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(new Set())
  const [toast, setToast] = useState({ visible: false, message: '' })

  const demoAthlete = athletes[2]
  const myAlerts = alerts.filter(a => a.athleteId === demoAthlete.id)
  const activeAlerts = myAlerts.filter((_, i) => !dismissed.has(i))

  const showToast = (msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }

  const handleDismiss = (i, alertType) => {
    setDismissed(prev => new Set([...prev, i]))
    showToast(`"${alertType}" marked as acknowledged`)
  }

  const alertHistory = [
    { id: 1, date: 'Jul 14', type: 'HRV Decline Detected', level: 'yellow', desc: '3-day downward trend in HRV detected', time: '3 days ago' },
    { id: 2, date: 'Jul 13', type: 'Sleep < 6hrs', level: 'yellow', desc: 'Sleep dropped below 6 hours for 3 consecutive nights', time: '4 days ago' },
    { id: 3, date: 'Jul 12', type: 'Recovery Check-in', level: 'info', desc: 'System flagged your metrics for coach review', time: '5 days ago' },
  ]

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="athlete" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Alert Center</h2>
            <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Your wellness alerts and system notifications</p>
          </motion.div>

          {/* Active Alerts */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-500" />
                Active Alerts ({activeAlerts.length})
              </h3>
            </div>
            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-8 text-center"
                >
                  <Shield size={40} className="text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold text-pivot-700 dark:text-slate-200">All Clear</p>
                  <p className="text-sm text-pivot-400 mt-1">No active alerts. Keep up the good work!</p>
                </motion.div>
              ) : (
                activeAlerts.map((alert, i) => {
                  const globalIndex = myAlerts.indexOf(alert)
                  return (
                    <motion.div
                      key={globalIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                      transition={{ delay: 0.1 * Math.min(i, 5) }}
                      className={`glass-card p-5 border-l-4 ${
                        alert.level === 'black' ? 'border-l-slate-800 dark:border-l-slate-300' :
                        alert.level === 'red' ? 'border-l-rose-500' : 'border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertBadge level={alert.level} />
                          <span className="text-sm font-semibold text-pivot-800 dark:text-slate-200">{alert.type}</span>
                        </div>
                        <span className="text-[10px] text-pivot-400">{alert.time}</span>
                      </div>
                      <p className="text-sm text-pivot-600 dark:text-slate-400 mb-3">{alert.message}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate('/athlete')}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors active:scale-95 hover:opacity-90"
                          style={{ background: palette.gradient }}
                        >
                          <span className="flex items-center gap-1"><Eye size={12} /> View Dashboard</span>
                        </button>
                        <button
                          onClick={() => handleDismiss(globalIndex, alert.type)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-pivot-500 dark:text-slate-400 border border-pivot-200 dark:border-slate-600 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Alert History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info size={14} />
              Alert History
            </h3>
            <div className="glass-card divide-y divide-pivot-100 dark:divide-slate-700/30">
              {alertHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-pivot-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      item.level === 'yellow' ? 'bg-amber-400' :
                      item.level === 'red' ? 'bg-rose-500' :
                      'bg-blue-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-pivot-700 dark:text-slate-200 truncate">{item.type}</p>
                      <p className="text-xs text-pivot-400 truncate">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-pivot-400 dark:text-slate-500">{item.time}</span>
                    <ChevronRight size={14} className="text-pivot-300" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="h-4" />
        </main>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
