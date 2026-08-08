import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Shield, Info, ChevronRight, CheckCircle2, Eye, MessageCircle, X, TrendingDown, TrendingUp, Minus, Clock, Activity } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge from '../ui/AlertBadge'
import ConversationModal from '../ui/ConversationModal'
import { useAlerts } from '../../context/AlertContext'
import { useMoodColors } from '../../context/MoodColorContext'
import { isMockMode } from '../../config/api'
import { apiListMessages, apiGetUnreadCount } from '../../config/api'

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

  // Conversations with coaches
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [conversationUser, setConversationUser] = useState(null)

  const demoAthlete = athletes[2] || athletes[0] || { id: null }
  const myAlerts = demoAthlete.id ? alerts.filter(a => a.athleteId === demoAthlete.id) : []
  const activeAlerts = myAlerts.filter((_, i) => !dismissed.has(i))

  // Group raw messages by the other user, keeping the latest preview
  const conversations = useMemo(() => {
    const map = new Map()
    messages.forEach((msg) => {
      const otherId = msg.otherUserId
      if (!otherId) return
      const existing = map.get(otherId)
      if (!existing || new Date(msg.createdAt) > new Date(existing.createdAt)) {
        map.set(otherId, msg)
      }
    })
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [messages])

  const showToast = (msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }

  const handleDismiss = (i, alertType) => {
    setDismissed(prev => new Set([...prev, i]))
    showToast(`"${alertType}" marked as acknowledged`)
  }

  // Fetch coach messages (real mode only)
  const refreshMessages = async () => {
    if (isMockMode()) return
    try {
      const data = await apiListMessages({ limit: 50 })
      setMessages(data.messages || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    if (isMockMode()) return
    refreshMessages()
    // Poll lightly so coach's message shows up without manual refresh
    const t = setInterval(refreshMessages, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openConversation = (msg) => {
    setConversationUser({
      id: msg.otherUserId,
      name: msg.otherUserName,
      role: msg.otherUserRole,
    })
  }

  const [selectedHistory, setSelectedHistory] = useState(null)

  const alertHistory = [
    {
      id: 1,
      date: 'Jul 14',
      type: 'HRV Decline Detected',
      level: 'yellow',
      desc: '3-day downward trend in HRV detected',
      time: '3 days ago',
      details: {
        triggeredAt: 'Jul 14, 2026 · 06:30 AM',
        duration: '3 days',
        status: 'resolved',
        metrics: [
          { label: 'HRV (Jul 11)', value: '62 ms', trend: 'baseline' },
          { label: 'HRV (Jul 12)', value: '55 ms', trend: 'down' },
          { label: 'HRV (Jul 13)', value: '48 ms', trend: 'down' },
          { label: 'HRV (Jul 14)', value: '42 ms', trend: 'down' },
        ],
        summary: 'Your HRV has declined 22.6% over the past 3 days, dropping from 62 ms to 42 ms. A sustained downward HRV trend typically signals elevated stress or incomplete recovery.',
        recommendation: 'Prioritize sleep (8+ hrs), reduce training intensity by 20% for 2 days, and consider a light active-recovery session. If trend continues, notify your coach.',
        coachNote: null,
      },
    },
    {
      id: 2,
      date: 'Jul 13',
      type: 'Sleep < 6hrs',
      level: 'yellow',
      desc: 'Sleep dropped below 6 hours for 3 consecutive nights',
      time: '4 days ago',
      details: {
        triggeredAt: 'Jul 13, 2026 · 07:00 AM',
        duration: '3 nights',
        status: 'resolved',
        metrics: [
          { label: 'Sleep (Jul 10)', value: '7.2 hrs', trend: 'good' },
          { label: 'Sleep (Jul 11)', value: '5.5 hrs', trend: 'down' },
          { label: 'Sleep (Jul 12)', value: '5.1 hrs', trend: 'down' },
          { label: 'Sleep (Jul 13)', value: '4.8 hrs', trend: 'down' },
        ],
        summary: 'Sleep duration fell below 6 hours for 3 consecutive nights. Chronic sleep debt under 6 hours is linked to reduced HRV, impaired decision-making, and higher injury risk.',
        recommendation: 'Set a consistent bedtime (target 10:30 PM), avoid screens 1 hour before sleep, and keep your room cool (65-68°F). Consider a 20-min nap if training in the afternoon.',
        coachNote: 'Tim — I noticed your sleep pattern dropped mid-week. Anything going on with classes or travel? Let me know if you need schedule adjustments. — Coach Sarah',
      },
    },
    {
      id: 3,
      date: 'Jul 12',
      type: 'Recovery Check-in',
      level: 'info',
      desc: 'System flagged your metrics for coach review',
      time: '5 days ago',
      details: {
        triggeredAt: 'Jul 12, 2026 · 08:00 AM',
        duration: '1 day',
        status: 'resolved',
        metrics: [
          { label: 'Resting HR', value: '58 bpm', trend: 'up' },
          { label: 'HRV', value: '51 ms', trend: 'down' },
          { label: 'Sleep', value: '6.2 hrs', trend: 'borderline' },
          { label: 'Mood Score', value: '6 / 10', trend: 'stable' },
        ],
        summary: 'Multiple metrics shifted simultaneously — resting HR rose slightly while HRV dipped. Although within yellow-range thresholds, the combined pattern triggered an automatic check-in flag for coach awareness.',
        recommendation: 'No immediate action required. Continue normal training but monitor tomorrow morning\'s HRV. If it drops below 45 ms, scale back intensity.',
        coachNote: 'Flagged for routine review. No intervention needed at this time. Keep an eye on it. — Coach Sarah',
      },
    },
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

          {/* Coach Conversations */}
          {!isMockMode() && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle size={14} className="text-accent-blue" />
                  Messages with Coach
                  {unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
              </div>
              {conversations.length === 0 ? (
                <div className="glass-card p-5 text-center">
                  <p className="text-sm text-pivot-400 dark:text-slate-500">No messages from your coach yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((preview) => {
                    const hasUnread = messages.some(
                      m => m.otherUserId === preview.otherUserId && !m.isSender && !m.readAt
                    )
                    return (
                      <button
                        key={preview.otherUserId}
                        onClick={() => openConversation(preview)}
                        className={`w-full glass-card p-4 text-left flex items-start gap-3 hover:shadow-elevated transition-all active:scale-[0.99] ${
                          hasUnread ? 'border-l-4 border-l-accent-blue' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(preview.otherUserName || 'C').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-pivot-800 dark:text-slate-200">
                              {preview.otherUserName || 'Coach'}
                            </span>
                            <span className="text-[10px] text-pivot-400 shrink-0">
                              {new Date(preview.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {preview.subject && !preview.isSender && (
                            <p className="text-xs text-pivot-500 dark:text-slate-400 truncate">{preview.subject}</p>
                          )}
                          <p className="text-sm text-pivot-700 dark:text-slate-300 mt-1 line-clamp-2">
                            {preview.isSender && <span className="text-pivot-400 mr-1">You:</span>}
                            {preview.body}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

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
                  onClick={() => setSelectedHistory(item)}
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

      {/* Conversation modal */}
      <AnimatePresence>
        {conversationUser && (
          <ConversationModal
            otherUser={conversationUser}
            onClose={() => {
              setConversationUser(null)
              refreshMessages()
            }}
          />
        )}
      </AnimatePresence>

      {/* Alert History detail modal */}
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl shadow-2xl border border-pivot-200 dark:border-slate-600 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className={`p-5 rounded-t-2xl border-b border-pivot-100 dark:border-slate-700/30 ${
                selectedHistory.level === 'yellow' ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                selectedHistory.level === 'red' ? 'bg-rose-50/50 dark:bg-rose-900/10' :
                'bg-blue-50/50 dark:bg-blue-900/10'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedHistory.level === 'yellow' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      selectedHistory.level === 'red' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-pivot-900 dark:text-white">{selectedHistory.type}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-pivot-400 flex items-center gap-1">
                          <Clock size={10} /> {selectedHistory.details.triggeredAt}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          selectedHistory.details.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {selectedHistory.details.status === 'resolved' ? 'Resolved' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHistory(null)}
                    className="p-1.5 rounded-lg text-pivot-400 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                {/* Metrics */}
                <div>
                  <h4 className="text-[11px] font-semibold text-pivot-400 uppercase tracking-wider mb-2">Relevant Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedHistory.details.metrics.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-[10px] text-pivot-400 uppercase">{m.label}</p>
                          {m.trend === 'down' && <TrendingDown size={10} className="text-rose-400" />}
                          {m.trend === 'up' && <TrendingUp size={10} className="text-emerald-400" />}
                          {m.trend === 'stable' && <Minus size={10} className="text-pivot-300" />}
                          {m.trend === 'good' && <TrendingUp size={10} className="text-emerald-400" />}
                          {m.trend === 'borderline' && <TrendingDown size={10} className="text-amber-400" />}
                        </div>
                        <p className="text-sm font-semibold text-pivot-800 dark:text-slate-200">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-[11px] font-semibold text-pivot-400 uppercase tracking-wider mb-1.5">Summary</h4>
                  <p className="text-sm text-pivot-700 dark:text-slate-300 leading-relaxed">{selectedHistory.details.summary}</p>
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-xl bg-accent-teal/5 dark:bg-teal-900/10 border border-accent-teal/10 dark:border-teal-700/20">
                  <h4 className="text-[11px] font-semibold text-accent-teal uppercase tracking-wider mb-1.5">Recommendation</h4>
                  <p className="text-sm text-pivot-700 dark:text-slate-300 leading-relaxed">{selectedHistory.details.recommendation}</p>
                </div>

                {/* Coach Note */}
                {selectedHistory.details.coachNote && (
                  <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 border border-pivot-100 dark:border-slate-700/30">
                    <h4 className="text-[11px] font-semibold text-pivot-400 uppercase tracking-wider mb-1.5">Coach Note</h4>
                    <p className="text-sm text-pivot-600 dark:text-slate-400 leading-relaxed italic">"{selectedHistory.details.coachNote}"</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedHistory(null)}
                    className="px-4 py-2 rounded-xl bg-pivot-100 dark:bg-slate-700 text-pivot-700 dark:text-slate-200 text-sm font-medium hover:bg-pivot-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
