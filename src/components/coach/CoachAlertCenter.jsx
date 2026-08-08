import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Search, Filter, Clock, CheckCircle2, MessageCircle, CheckCheck, ChevronDown, ChevronRight, Users, Send, X, Loader2, Stethoscope } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge, { StatusPill } from '../ui/AlertBadge'
import ConversationModal from '../ui/ConversationModal'
import InterventionModal from '../ui/InterventionModal'
import InterventionTimeline from '../ui/InterventionTimeline'
import { useAlerts } from '../../context/AlertContext'
import { useUser } from '../../context/UserContext'
import { isMockMode } from '../../config/api'
import { apiListAthletes, apiListCoaches, apiListMessages, apiGetUnreadCount, apiSendMessage, apiListInterventions, apiCreateIntervention, apiUpdateIntervention } from '../../config/api'

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
  { id: 'h8', athleteName: 'Casey Park', level: 'yellow', type: 'Training Load Spike', date: 'Jul 11, 18:45', resolved: true },
  { id: 'h9', athleteName: 'Morgan Smith', level: 'red', type: 'Mood Decline', date: 'Jul 10, 12:00', resolved: true },
  { id: 'h10', athleteName: 'Taylor Brooks', level: 'yellow', type: 'Mild HRV Drop', date: 'Jul 09, 09:15', resolved: true },
  { id: 'h11', athleteName: 'Jordan Lee', level: 'yellow', type: 'Sleep Inconsistency', date: 'Jul 08, 22:30', resolved: true },
  { id: 'h12', athleteName: 'Casey Park', level: 'yellow', type: 'RPE Anomaly', date: 'Jul 07, 15:00', resolved: true },
  { id: 'h13', athleteName: 'Morgan Smith', level: 'red', type: 'Burnout Warning', date: 'Jul 06, 11:00', resolved: true },
  { id: 'h14', athleteName: 'Taylor Brooks', level: 'yellow', type: 'Recovery Lag', date: 'Jul 05, 17:30', resolved: true },
  { id: 'h15', athleteName: 'Jordan Lee', level: 'yellow', type: 'Hydration Deficit', date: 'Jul 04, 14:20', resolved: true },
  { id: 'h16', athleteName: 'Casey Park', level: 'yellow', type: 'Missed Check-in', date: 'Jul 03, 08:00', resolved: true },
]

const PAGE_SIZE = 8

export default function CoachAlertCenter() {
  const { alerts, totalAlerts, alertCount } = useAlerts()
  const { user: me } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const [actionMenu, setActionMenu] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' })
  const [historyPage, setHistoryPage] = useState(1)
  const [historyStatus, setHistoryStatus] = useState('all') // 'all' | 'active' | 'resolved'
  const [historySearch, setHistorySearch] = useState(initialQuery)

  // Keep search box in sync with URL `?q=` so deep-links from the dashboard work
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== historySearch) {
      setHistorySearch(q)
      setHistoryPage(1)
    }
  }, [searchParams])

  const updateHistorySearch = (next) => {
    setHistorySearch(next)
    setHistoryPage(1)
    // Reflect into URL so the link can be shared / reloaded
    const params = new URLSearchParams(searchParams)
    if (next) params.set('q', next)
    else params.delete('q')
    setSearchParams(params, { replace: true })
  }

  // Athletes directory + conversation modal state
  const [athletes, setAthletes] = useState([])
  const [conversationUser, setConversationUser] = useState(null)
  const menuRef = useRef(null)

  // Coaches directory + notify-coaches modal state
  const [coaches, setCoaches] = useState([])
  const [coachesLoading, setCoachesLoading] = useState(false)
  const [notifyAlert, setNotifyAlert] = useState(null)
  const [notifySelected, setNotifySelected] = useState(new Set())
  const [notifyBody, setNotifyBody] = useState('')
  const [notifySending, setNotifySending] = useState(false)

  // Coach inbox (so other coaches can receive notifications)
  const [coachConversations, setCoachConversations] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Intervention modal state
  const [interventionAlert, setInterventionAlert] = useState(null)
  const [interventionEditData, setInterventionEditData] = useState(null)
  const [interventionViewAlert, setInterventionViewAlert] = useState(null)
  const [interventionsLoading, setInterventionsLoading] = useState(false)
  const [interventionsList, setInterventionsList] = useState([])

  const showToast = (msg, variant = 'success') => {
    setToast({ visible: true, message: msg, variant })
    setTimeout(() => setToast({ visible: false, message: '', variant: 'success' }), 2500)
  }

  const loadCoachInbox = async () => {
    if (isMockMode()) return
    setMessagesLoading(true)
    try {
      const [messagesData, countData] = await Promise.all([
        apiListMessages({ limit: 100 }),
        apiGetUnreadCount(),
      ])
      setCoachConversations(messagesData.messages || [])
      setUnreadCount(countData.unreadCount || 0)
    } catch {
      setCoachConversations([])
      setUnreadCount(0)
    } finally {
      setMessagesLoading(false)
    }
  }

  const groupedConversations = useMemo(() => {
    const map = new Map()
    coachConversations.forEach(msg => {
      const other = {
        id: msg.otherUserId,
        name: msg.otherUserName || 'Unknown',
        role: msg.otherUserRole || '',
      }
      if (!map.has(other.id) || new Date(msg.createdAt) > new Date(map.get(other.id).createdAt)) {
        map.set(other.id, { other, latest: msg })
      }
    })
    return Array.from(map.values()).sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt))
  }, [coachConversations])

  // Don't suggest notifying coaches who have the same role as the current user.
  // Head Coaches additionally never notify any Head Coach through this flow.
  const [coachSearch, setCoachSearch] = useState('')
  const coachListRef = useRef(null)

  const selectableCoaches = useMemo(() => {
    if (!me?.coachRole) return coaches
    const myRole = String(me.coachRole).trim().toLowerCase()
    if (myRole === 'head coach') {
      return coaches
        .filter(c => String(c.coachRole || '').trim().toLowerCase() !== 'head coach')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    }
    return coaches
      .filter(c => String(c.coachRole || '').trim().toLowerCase() !== myRole)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [coaches, me?.coachRole])

  const filteredSelectableCoaches = useMemo(() => {
    const q = coachSearch.trim().toLowerCase()
    if (!q) return selectableCoaches
    return selectableCoaches.filter(c =>
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.email || '').toLowerCase().includes(q) ||
      String(c.coachRole || '').toLowerCase().includes(q)
    )
  }, [selectableCoaches, coachSearch])

  // Filter active alerts only by dismissed set
  const activeAlerts = alerts.filter((_, i) => !dismissedAlerts.has(i))

  const handleDismiss = (alert) => {
    const idx = alerts.indexOf(alert)
    setDismissedAlerts(prev => new Set([...prev, idx]))
    setActionMenu(null)
    showToast(`Alert for ${alert.athleteName} marked as addressed`)
  }

  // Load athletes + coaches directories once (real mode only) so we can resolve
  // alert names to user IDs for sending messages and notify peer coaches.
  useEffect(() => {
    if (isMockMode()) {
      // Mock coaches for demo
      setCoaches([
        { id: 101, name: 'Assistant Coach Smith', email: 'smith@pivot.dev', sport: 'rowing', coachRole: 'Assistant' },
        { id: 102, name: 'Head Coach Williams', email: 'williams@pivot.dev', sport: 'rowing', coachRole: 'Head' },
      ])
      setCoachConversations([])
      return
    }
    let cancelled = false
    apiListAthletes()
      .then(data => { if (!cancelled) setAthletes(data.athletes || []) })
      .catch(() => { if (!cancelled) setAthletes([]) })

    setCoachesLoading(true)
    apiListCoaches()
      .then(data => { if (!cancelled) setCoaches(data.coaches || []) })
      .catch(() => { if (!cancelled) setCoaches([]) })
      .finally(() => { if (!cancelled) setCoachesLoading(false) })

    loadCoachInbox()
    return () => { cancelled = true }
  }, [])

  const resolveRecipient = (alert) => {
    if (!alert) return null
    const name = (alert.athleteName || '').trim().toLowerCase()
    if (!name) return null
    // Exact match preferred
    return athletes.find(a => a.name.toLowerCase() === name)
        || athletes.find(a => a.name.toLowerCase().includes(name))
        || null
  }

  const openConversationFor = (alert) => {
    setActionMenu(null)
    const recipient = resolveRecipient(alert)
    if (!recipient) {
      showToast(`Could not find athlete "${alert.athleteName}" in your roster`, 'error')
      return
    }
    setConversationUser({
      id: recipient.id,
      name: recipient.name,
      role: recipient.role,
    })
  }

  const openNotifyModal = (alert) => {
    setActionMenu(null)
    setNotifyAlert(alert)
    setNotifySelected(new Set())
    setCoachSearch('')
    setNotifyBody(
      `FYI: ${alert.athleteName} has a ${alert.level?.toUpperCase() || 'ALERT'} — ${alert.type}. Please keep an eye on this athlete.`
    )
    // Reset coach list scroll to top so the first coach (e.g. Assistant Coach) is visible
    requestAnimationFrame(() => {
      if (coachListRef.current) coachListRef.current.scrollTop = 0
    })
  }

  const closeNotifyModal = () => {
    setNotifyAlert(null)
    setNotifySelected(new Set())
    setNotifyBody('')
    setNotifySending(false)
  }

  const toggleCoachSelection = (id) => {
    setNotifySelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllCoaches = () => {
    // Select only the coaches currently visible in the list (respects search filter)
    setNotifySelected(new Set(filteredSelectableCoaches.map(c => c.id)))
  }

  const selectNoCoaches = () => {
    setNotifySelected(new Set())
  }

  const handleNotifyCoaches = async () => {
    if (!notifyAlert || notifySelected.size === 0 || !notifyBody.trim()) return
    if (isMockMode()) {
      showToast(`Notification sent to ${notifySelected.size} coach(s) (mock)`)
      closeNotifyModal()
      return
    }
    setNotifySending(true)
    try {
      const results = await Promise.allSettled(
        Array.from(notifySelected).map(id =>
          apiSendMessage({
            recipientId: id,
            body: notifyBody.trim(),
            subject: `Alert: ${notifyAlert.athleteName} — ${notifyAlert.type}`,
            alertLevel: notifyAlert.level,
            alertType: notifyAlert.type,
          })
        )
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length) {
        showToast(`Sent to ${notifySelected.size - failed.length} of ${notifySelected.size} coaches`, 'error')
      } else {
        showToast(`Notification sent to ${notifySelected.size} coach(s)`)
      }
      await loadCoachInbox()
      closeNotifyModal()
    } catch (err) {
      showToast(err.message || 'Failed to send notifications', 'error')
    } finally {
      setNotifySending(false)
    }
  }

  // Intervention handlers
  const openInterventionModal = (alert, editData = null) => {
    setActionMenu(null)
    setInterventionAlert(alert)
    setInterventionEditData(editData)
  }

  const closeInterventionModal = () => {
    setInterventionAlert(null)
    setInterventionEditData(null)
  }

  const handleSaveIntervention = async (payload, id) => {
    if (isMockMode()) {
      showToast('Intervention logged (mock)')
      if (interventionViewAlert) {
        setInterventionsList(prev => [
          {
            id: Date.now(),
            alertId: interventionAlert?.id,
            athleteId: interventionAlert?.athleteId,
            interventionType: payload.intervention_type,
            description: payload.description,
            actionsTaken: payload.actions_taken,
            status: payload.status,
            effectivenessScore: payload.effectiveness_score,
            outcomeNotes: payload.outcome_notes,
            coachName: me?.name || 'Coach',
            startedAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
      return
    }
    if (id) {
      await apiUpdateIntervention(id, payload)
      showToast('Intervention updated')
    } else {
      await apiCreateIntervention(payload)
      showToast('Intervention logged')
    }
    if (interventionViewAlert) {
      await loadInterventions(interventionViewAlert)
    }
  }

  const loadInterventions = async (alert) => {
    if (isMockMode()) return
    setInterventionsLoading(true)
    try {
      const data = await apiListInterventions({ alertId: alert.id, limit: 50 })
      setInterventionsList(data.interventions || [])
    } catch (err) {
      setInterventionsList([])
    } finally {
      setInterventionsLoading(false)
    }
  }

  const openInterventionView = (alert) => {
    setActionMenu(null)
    setInterventionViewAlert(alert)
    loadInterventions(alert)
  }

  const closeInterventionView = () => {
    setInterventionViewAlert(null)
    setInterventionsList([])
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

          {/* Coach Messages / Notifications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageCircle size={14} className="text-accent-blue" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <button
                onClick={loadCoachInbox}
                disabled={messagesLoading}
                className="text-[11px] text-pivot-500 dark:text-slate-400 hover:text-pivot-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {messagesLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {groupedConversations.length === 0 ? (
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-pivot-400 dark:text-slate-500">No messages yet</p>
                <p className="text-xs text-pivot-400 mt-1">Use “Notify Coaches” on an alert to alert your staff.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedConversations.map(({ other, latest }) => {
                  const isUnread = !latest.isSender && !latest.readAt
                  return (
                    <button
                      key={other.id}
                      onClick={() => setConversationUser(other)}
                      className={`glass-card p-3 text-left flex items-center gap-3 hover:shadow-elevated transition-all active:scale-[0.99] ${
                        isUnread ? 'border-l-4 border-l-accent-blue' : ''
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-teal to-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(other.name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-pivot-800 dark:text-slate-200 truncate">
                            {other.name}
                          </span>
                          <span className="text-[10px] text-pivot-400 shrink-0">
                            {new Date(latest.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${isUnread ? 'text-pivot-900 dark:text-white font-medium' : 'text-pivot-500 dark:text-slate-400'}`}>
                          {latest.isSender ? 'You: ' : ''}{latest.body}
                        </p>
                      </div>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-accent-blue shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Active Alerts */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              Active Alerts ({activeAlerts.length})
              {historySearch && <span className="font-normal text-pivot-400">— filtered</span>}
            </h3>
            <div className="space-y-2">
              {activeAlerts.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <CheckCheck size={40} className="text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold text-pivot-700 dark:text-slate-200">All Clear</p>
                  <p className="text-sm text-pivot-400 mt-1">{historySearch ? 'No alerts match your search.' : 'No active alerts at this time.'}</p>
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
                    } ${actionMenu === i ? 'z-30' : 'z-0'}`}
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
                                  onClick={() => openConversationFor(alert)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <MessageCircle size={14} className="text-accent-blue" /> Contact Athlete
                                </button>
                                <button
                                  onClick={() => openInterventionModal(alert)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                                >
                                  <Stethoscope size={14} className="text-accent-teal" /> Log Intervention
                                </button>
                                <button
                                  onClick={() => openInterventionView(alert)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                  <Clock size={14} className="text-indigo-500" /> View Timeline
                                </button>
                                <button
                                  onClick={() => openNotifyModal(alert)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-pivot-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                  <Users size={14} className="text-amber-500" /> Notify Coaches
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h3 className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} />
                Alert History
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => updateHistorySearch(e.target.value)}
                    placeholder="Search by name or type..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 w-48"
                  />
                </div>
                <div className="relative">
                  <select
                    value={historyStatus}
                    onChange={(e) => { setHistoryStatus(e.target.value); setHistoryPage(1) }}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
                </div>
                {(historySearch || historyStatus !== 'all') && (
                  <button
                    onClick={() => { updateHistorySearch(''); setHistoryStatus('all'); setHistoryPage(1) }}
                    className="text-xs text-pivot-400 hover:text-pivot-600 dark:hover:text-slate-300 transition-colors px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto divide-y divide-pivot-100 dark:divide-slate-700/30 custom-scrollbar">
                {(() => {
                  // Apply search + status filters
                  const filtered = alertHistory.filter(item => {
                    const q = historySearch.trim().toLowerCase()
                    const matchesQuery = !q
                      || item.athleteName.toLowerCase().includes(q)
                      || item.type.toLowerCase().includes(q)
                    const matchesStatus = historyStatus === 'all'
                      ? true
                      : historyStatus === 'active' ? !item.resolved : item.resolved
                    return matchesQuery && matchesStatus
                  })
                  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
                  const safePage = Math.min(historyPage, totalPages)
                  const start = (safePage - 1) * PAGE_SIZE
                  const pageItems = filtered.slice(start, start + PAGE_SIZE)
                  if (pageItems.length === 0) {
                    return (
                      <div className="p-8 text-center">
                        <p className="text-sm text-pivot-500 dark:text-slate-400">No history matches your filters</p>
                      </div>
                    )
                  }
                  return pageItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-pivot-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer active:scale-[0.99]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        item.level === 'yellow' ? 'bg-amber-400' :
                        item.level === 'red' ? 'bg-rose-500' :
                        item.level === 'black' ? 'bg-slate-800 dark:bg-slate-300' :
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
                  ))
                })()}
              </div>
              {(() => {
                const filtered = alertHistory.filter(item => {
                  const q = historySearch.trim().toLowerCase()
                  const matchesQuery = !q
                    || item.athleteName.toLowerCase().includes(q)
                    || item.type.toLowerCase().includes(q)
                  const matchesStatus = historyStatus === 'all'
                    ? true
                    : historyStatus === 'active' ? !item.resolved : item.resolved
                  return matchesQuery && matchesStatus
                })
                if (filtered.length <= PAGE_SIZE) return null
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
                const safePage = Math.min(historyPage, totalPages)
                return (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-pivot-100 dark:border-slate-700/30 bg-pivot-50/40 dark:bg-slate-800/30">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-pivot-600 dark:text-slate-300 hover:bg-pivot-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={12} className="rotate-180" /> Prev
                    </button>
                    <span className="text-xs text-pivot-500 dark:text-slate-400">
                      Page <span className="font-semibold text-pivot-700 dark:text-slate-200">{safePage}</span> of {totalPages}
                      <span className="text-pivot-400 ml-1">· {filtered.length} total</span>
                    </span>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-pivot-600 dark:text-slate-300 hover:bg-pivot-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  </div>
                )
              })()}
            </div>
          </motion.div>

          <div className="h-4" />
        </main>
      </div>

      <Toast message={toast.message} visible={toast.visible} variant={toast.variant} />

      {/* Notify coaches modal */}
      <AnimatePresence>
        {notifyAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNotifyModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl shadow-2xl border border-pivot-200 dark:border-slate-600 w-full max-w-md flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-pivot-100 dark:border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-amber-500" />
                  <h3 className="text-sm font-semibold text-pivot-900 dark:text-white">
                    Notify Coaches
                  </h3>
                </div>
                <button
                  onClick={closeNotifyModal}
                  className="p-1.5 rounded-lg text-pivot-400 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    {notifyAlert.athleteName}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {notifyAlert.type} ({notifyAlert.level?.toUpperCase()})
                  </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-pivot-700 dark:text-slate-300">
                    Select coaches
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllCoaches}
                      className="text-[11px] text-accent-teal hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-pivot-300">|</span>
                    <button
                      onClick={selectNoCoaches}
                      className="text-[11px] text-pivot-500 hover:text-pivot-700 dark:hover:text-slate-300"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                  <input
                    type="text"
                    value={coachSearch}
                    onChange={(e) => setCoachSearch(e.target.value)}
                    placeholder="Find a coach…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                  />
                </div>

                {coachesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="text-accent-blue animate-spin" />
                  </div>
                ) : selectableCoaches.length === 0 ? (
                  <p className="text-xs text-pivot-500 dark:text-slate-400 py-4 text-center">
                    No other coaches available to notify.
                  </p>
                ) : (
                  <div
                    ref={coachListRef}
                    className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1 mb-4"
                  >
                    {filteredSelectableCoaches.map(coach => (
                      <label
                        key={coach.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-pivot-100 dark:border-slate-700/50 hover:bg-pivot-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={notifySelected.has(coach.id)}
                          onChange={() => toggleCoachSelection(coach.id)}
                          className="w-4 h-4 rounded border-pivot-300 text-accent-teal focus:ring-accent-teal/40"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-pivot-800 dark:text-slate-200 truncate">
                              {coach.name}
                            </p>
                            <span className="px-1.5 py-0.5 rounded-md bg-pivot-100 dark:bg-slate-700 text-[10px] text-pivot-600 dark:text-slate-300 shrink-0">
                              {coach.coachRole || 'Coach'}
                            </span>
                          </div>
                          <p className="text-[10px] text-pivot-400 truncate">
                            {coach.email || ''}
                          </p>
                        </div>
                      </label>
                    ))}
                    {filteredSelectableCoaches.length === 0 && coachSearch && (
                      <p className="text-xs text-pivot-500 dark:text-slate-400 py-3 text-center">
                        No coaches match “{coachSearch}”
                      </p>
                    )}
                  </div>
                )}

                {coaches.length > selectableCoaches.length && me?.coachRole && (
                  <p className="text-[10px] text-pivot-400 mb-3">
                    {String(me.coachRole).trim().toLowerCase() === 'head coach'
                      ? 'Head Coaches are hidden from this notification list.'
                      : `Coaches with the “${me.coachRole}” role are hidden because that is your role.`}
                  </p>
                )}

                <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">
                  Message
                </label>
                <textarea
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  rows={4}
                  placeholder="Write a short note to the selected coaches…"
                  className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 focus:border-accent-teal resize-none"
                />
                <p className="text-[10px] text-pivot-400 mt-1.5">
                  {notifySelected.size} coach{notifySelected.size === 1 ? '' : 'es'} selected
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-pivot-100 dark:border-slate-700/30">
                <button
                  onClick={closeNotifyModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-pivot-600 dark:text-slate-300 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotifyCoaches}
                  disabled={notifySending || notifySelected.size === 0 || !notifyBody.trim() || coachesLoading}
                  className="px-4 py-2 rounded-xl bg-accent-teal text-white text-xs font-medium hover:bg-teal-600 transition-colors active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notifySending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {notifySending ? 'Sending…' : `Send to ${notifySelected.size}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention modal */}
      <AnimatePresence>
        {interventionAlert && (
          <InterventionModal
            alert={interventionAlert}
            athlete={resolveRecipient(interventionAlert)}
            initialData={interventionEditData}
            onClose={closeInterventionModal}
            onSaved={handleSaveIntervention}
          />
        )}
      </AnimatePresence>

      {/* Intervention timeline view modal */}
      <AnimatePresence>
        {interventionViewAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeInterventionView}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl shadow-2xl border border-pivot-200 dark:border-slate-600 w-full max-w-lg flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-pivot-100 dark:border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-semibold text-pivot-900 dark:text-white">Intervention Timeline</h3>
                </div>
                <button
                  onClick={closeInterventionView}
                  className="p-1.5 rounded-lg text-pivot-400 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    {interventionViewAlert.athleteName}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {interventionViewAlert.type} ({interventionViewAlert.level?.toUpperCase()})
                  </p>
                </div>
                {interventionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="text-accent-blue animate-spin" />
                  </div>
                ) : (
                  <InterventionTimeline
                    alertId={interventionViewAlert.id}
                    onEdit={(item) => openInterventionModal(interventionViewAlert, item)}
                  />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-pivot-100 dark:border-slate-700/30">
                <button
                  onClick={() => openInterventionModal(interventionViewAlert)}
                  className="px-4 py-2 rounded-xl bg-accent-teal text-white text-xs font-medium hover:bg-teal-600 transition-colors active:scale-95 flex items-center gap-1.5"
                >
                  <Stethoscope size={14} /> Log New Intervention
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation modal */}
      <AnimatePresence>
        {conversationUser && (
          <ConversationModal
            otherUser={conversationUser}
            onClose={() => setConversationUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
