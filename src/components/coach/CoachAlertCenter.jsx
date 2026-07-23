import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Search, Filter, Clock, CheckCircle2, MessageCircle, CheckCheck, ChevronDown } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge, { StatusPill } from '../ui/AlertBadge'
import { useAlerts } from '../../context/AlertContext'

function Toast({ message, visible, variant }) {
  const bg = variant === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl ${bg} text-white shadow-xl text-sm font-medium`}
        >
          <CheckCircle2 size={18} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const alertHistory = [
  { id: 'h1', athleteName: 'Casey Park', level: 'black', type: 'URGENT: Athlete in Crisis', date: 'Jul 16, 09:30', resolved: false },
  { id: 'h2', athleteName: 'Morgan Smith', level: 'red', type: 'Physical & Mental Fatigue', date: 'Jul 15, 14:20', resolved: false },
  { id: 'h3', athleteName: 'Jordan Lee', level: 'yellow', type: 'Recovery Deficiency', date: 'Jul 15, 08:00', resolved: false },
  { id: 'h4', athleteName: 'Casey Park', level: 'red', type: 'Sleep Deprivation — Critical', date: 'Jul 14, 22:15', resolved: false },
  { id: 'h5', athleteName: 'Morgan Smith', level: 'yellow', type: 'Recovery Deficiency', date: 'Jul 14, 10:00', resolved: true },
  { id: 'h6', athleteName: 'Jordan Lee', level: 'yellow', type: 'Sleep Deprivation', date: 'Jul 13, 07:30', resolved: true },
  { id: 'h7', athleteName: 'Taylor Brooks', level: 'yellow', type: 'Recovery Deficiency', date: 'Jul 12, 16:00', resolved: true },
]

export default function CoachAlertCenter() {
  const { alerts, totalAlerts, alertCount } = useAlerts()
  const [searchQuery, setSearchQuery] = useState('')
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const [actionMenu, setActionMenu] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' })

  const showToast = (msg, variant = 'success') => {
    setToast({ visible: true, message: msg, variant })
    setTimeout(() => setToast({ visible: false, message: '', variant: 'success' }), 2500)
  }

  // Filter alerts by search
  const filteredAlerts = searchQuery
    ? alerts.filter(a => a.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) || a.type.toLowerCase().includes(searchQuery.toLowerCase()))
    : alerts

  const activeAlerts = filteredAlerts.filter((_, i) => {
    const globalIdx = alerts.indexOf(filteredAlerts[i])
    return !dismissedAlerts.has(globalIdx)
  })

  const handleDismiss = (alert) => {
    const idx = alerts.indexOf(alert)
    setDismissedAlerts(prev => new Set([...prev, idx]))
    setActionMenu(null)
    showToast(`Alert for ${alert.athleteName} marked as addressed`)
  }

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="coach" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Alert Center</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Manage and track all team wellness alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or type..."
                  className="pl-9 pr-4 py-2 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 w-52"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-pivot-400 hover:text-pivot-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>

          {/* Alert Summary Cards */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center cursor-pointer hover:shadow-elevated transition-shadow">
              <p className="text-3xl font-bold text-pivot-900 dark:text-white">{totalAlerts - dismissedAlerts.size}</p>
              <p className="text-xs text-pivot-400 mt-1">Total Active</p>
            </div>
            {alertCount.black > 0 && (
              <div className="glass-card p-4 text-center border-l-4 border-l-slate-800 dark:border-l-slate-300">
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{alertCount.black}</p>
                <p className="text-xs text-pivot-400 mt-1">Urgent</p>
              </div>
            )}
            {alertCount.red > 0 && (
              <div className="glass-card p-4 text-center border-l-4 border-l-rose-500">
                <p className="text-3xl font-bold text-rose-500">{alertCount.red}</p>
                <p className="text-xs text-pivot-400 mt-1">High Risk</p>
              </div>
            )}
            {alertCount.yellow > 0 && (
              <div className="glass-card p-4 text-center border-l-4 border-l-amber-500">
                <p className="text-3xl font-bold text-amber-500">{alertCount.yellow}</p>
                <p className="text-xs text-pivot-400 mt-1">Monitor</p>
              </div>
            )}
          </motion.div>

          {/* Active Alerts */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              Active Alerts ({activeAlerts.length})
              {searchQuery && <span className="font-normal text-pivot-400">— filtered</span>}
            </h3>
            <div className="space-y-2">
              {activeAlerts.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <CheckCheck size={40} className="text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold text-pivot-700 dark:text-slate-200">All Clear</p>
                  <p className="text-sm text-pivot-400 mt-1">{searchQuery ? 'No alerts match your search.' : 'No active alerts at this time.'}</p>
                </div>
              ) : (
                activeAlerts.map((alert, i) => (
                  <motion.div
                    key={`${alert.athleteId}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.05 * Math.min(i, 8) }}
                    className={`glass-card p-4 border-l-4 relative ${
                      alert.level === 'black' ? 'border-l-slate-800 dark:border-l-slate-300' :
                      alert.level === 'red' ? 'border-l-rose-500' : 'border-l-amber-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertBadge level={alert.level} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-pivot-800 dark:text-slate-200">{alert.athleteName}</span>
                            <span className="text-xs text-pivot-400">— {alert.type}</span>
                          </div>
                          <p className="text-xs text-pivot-500 dark:text-slate-400">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-pivot-400">{alert.time}</span>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === i ? null : i)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent-teal text-white hover:bg-teal-600 transition-colors active:scale-95 flex items-center gap-1"
                          >
                            Act <ChevronDown size={12} />
                          </button>
                          <AnimatePresence>
                            {actionMenu === i && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                className="absolute right-0 top-full mt-1 z-20 glass-card p-1 shadow-xl rounded-xl border border-pivot-200 dark:border-slate-600 w-48"
                              >
                                <button
                                  onClick={() => handleDismiss(alert)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                >
                                  <CheckCheck size={14} className="text-emerald-500" /> Mark Addressed
                                </button>
                                <button
                                  onClick={() => { setActionMenu(null); showToast(`Message sent to ${alert.athleteName}`) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <MessageCircle size={14} className="text-accent-blue" /> Contact Athlete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Alert History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={14} />
              Alert History
            </h3>
            <div className="glass-card divide-y divide-pivot-100 dark:divide-slate-700/30">
              {alertHistory.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-pivot-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer active:scale-[0.99]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      item.level === 'yellow' ? 'bg-amber-400' :
                      item.level === 'red' ? 'bg-rose-500' :
                      'bg-blue-400'
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-pivot-700 dark:text-slate-200 truncate">{item.athleteName}</span>
                        <span className="text-xs text-pivot-400 truncate">{item.type}</span>
                      </div>
                      <span className="text-xs text-pivot-400">{item.date}</span>
                    </div>
                  </div>
                  <StatusPill status={item.resolved ? 'good' : 'warning'} />
                </div>
              ))}
            </div>
          </motion.div>

          <div className="h-4" />
        </main>
      </div>

      <Toast message={toast.message} visible={toast.visible} variant={toast.variant} />
    </div>
  )
}
