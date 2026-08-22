import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Send, Loader2, AlertCircle, CheckCircle2, XCircle, Clock,
  Calendar, UserCheck, UserX, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useUser } from '../../context/UserContext'
import {
  apiListSubstitutionRequests,
  apiListAthletes,
  apiListCoachSubstitutionCandidates,
  apiCoachApproveSubstitutionRequest,
  apiCoachInitiateSubstitution,
  apiCoachSendSubstitutionMessage,
} from '../../config/api'

const statusMeta = {
  pending_teammate: { label: 'Waiting for teammate', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  teammate_accepted: { label: 'Teammate accepted — needs your approval', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle2 },
  teammate_rejected: { label: 'Teammate declined', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', icon: XCircle },
  coach_approved: { label: 'Approved', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  coach_rejected: { label: 'Rejected', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', icon: XCircle },
}

export default function CoachSubstitutionPage() {
  const { user } = useUser()
  const [tab, setTab] = useState('requests') // 'requests' | 'initiate'
  const [requests, setRequests] = useState([])
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ athleteId: '', substituteId: '', trainingDate: '', reason: '' })
  const [candidates, setCandidates] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [reqRes, athRes] = await Promise.all([
        apiListSubstitutionRequests(),
        apiListAthletes(),
      ])
      setRequests(reqRes?.requests || [])
      setAthletes(athRes?.athletes || [])
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedAthlete = useMemo(
    () => athletes.find(a => String(a.id) === form.athleteId),
    [athletes, form.athleteId]
  )

  useEffect(() => {
    if (!form.athleteId) {
      setCandidates([])
      setForm(prev => ({ ...prev, substituteId: '' }))
      return
    }
    apiListCoachSubstitutionCandidates(form.athleteId)
      .then(res => {
        setCandidates(res?.candidates || [])
        setForm(prev => ({ ...prev, substituteId: '' }))
      })
      .catch(() => setCandidates([]))
  }, [form.athleteId])

  const handleApprove = async (id, approve) => {
    setError('')
    try {
      await apiCoachApproveSubstitutionRequest(id, approve)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to update request')
    }
  }

  const handleSendMessage = async (athleteId) => {
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const res = await apiCoachSendSubstitutionMessage({ athleteId })
      if (res.success) {
        setSuccess('Support message sent to athlete')
      } else {
        setError(res.message || 'Failed to send message')
      }
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInitiate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.athleteId || !form.substituteId || !form.trainingDate) {
      setError('Please select athlete, substitute, and training date')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiCoachInitiateSubstitution(form)
      if (res.success) {
        setSuccess('Substitution request initiated and sent to teammate')
        setForm({ athleteId: '', substituteId: '', trainingDate: '', reason: '' })
        await load()
        setTab('requests')
      } else {
        setError(res.message || 'Failed to initiate substitution')
      }
    } catch (err) {
      if (err.noSubstitute) {
        setError('No substitute is available for this athlete’s position. Send a supportive message instead.')
      } else {
        setError(err.message || 'Failed to initiate substitution')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-surface-light dark:bg-surface-dark p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-pivot-900 dark:text-white">Substitution Requests</h1>
          <p className="text-sm text-pivot-500 dark:text-slate-400">
            Review athlete leave requests and arrange substitutions for your roster.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'requests', label: `Pending Requests ${requests.length > 0 ? `(${requests.length})` : ''}` },
            { key: 'initiate', label: 'Initiate Substitution' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-pivot-600 dark:text-slate-300 hover:bg-pivot-50 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-2">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            {success}
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-bold text-pivot-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-accent-blue" />
                All Requests
              </h2>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-pivot-400 py-8">
                  <Loader2 size={18} className="animate-spin" /> Loading...
                </div>
              ) : requests.length === 0 ? (
                <p className="text-sm text-pivot-500 dark:text-slate-400 py-4 text-center">
                  No substitution requests yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => {
                    const meta = statusMeta[req.status] || statusMeta.pending_teammate
                    const Icon = meta.icon
                    const canApprove = req.status === 'teammate_accepted'
                    const isExpanded = expanded === req.id
                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-pivot-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-pivot-900 dark:text-white">
                                {req.requesterName}
                              </p>
                              <span className="text-xs text-pivot-400">→</span>
                              <p className="text-sm font-semibold text-pivot-900 dark:text-white">
                                {req.substituteName || '—'}
                              </p>
                            </div>
                            <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                              {req.position} · {req.trainingDate}
                            </p>
                            <span className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.color}`}>
                              <Icon size={12} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {canApprove ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(req.id, true)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1"
                                >
                                  <UserCheck size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleApprove(req.id, false)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors flex items-center gap-1"
                                >
                                  <UserX size={14} /> Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-pivot-200 dark:bg-slate-700 text-pivot-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                              >
                                <UserCheck size={14} /> Approve
                              </button>
                            )}
                            <button
                              onClick={() => setExpanded(isExpanded ? null : req.id)}
                              className="text-xs text-pivot-400 hover:text-pivot-600 flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? 'Less' : 'Details'}
                            </button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-pivot-100 dark:border-slate-700 text-xs text-pivot-500 dark:text-slate-400 space-y-1">
                                <p>Reason: {req.reason || '—'}</p>
                                {req.coachNote && <p>Coach note: {req.coachNote}</p>}
                                <p>Requested: {new Date(req.createdAt).toLocaleString()}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'initiate' && (
            <motion.div
              key="initiate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-bold text-pivot-900 dark:text-white mb-4 flex items-center gap-2">
                <Send size={20} className="text-accent-blue" />
                Initiate Substitution
              </h2>

              <form onSubmit={handleInitiate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">
                    Athlete <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.athleteId}
                    onChange={e => setForm(prev => ({ ...prev, athleteId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:ring-2 focus:ring-accent-blue/40 focus:outline-none"
                  >
                    <option value="">Select an athlete</option>
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.position || 'No position'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">
                    Training Date <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                    <input
                      type="date"
                      required
                      value={form.trainingDate}
                      onChange={e => setForm(prev => ({ ...prev, trainingDate: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:ring-2 focus:ring-accent-blue/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">
                    Substitute <span className="text-red-400">*</span>
                  </label>
                  {form.athleteId && candidates.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p>No substitute available for {selectedAthlete?.position || 'this position'}.</p>
                        <button
                          type="button"
                          onClick={() => handleSendMessage(form.athleteId)}
                          disabled={submitting}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                          Send AI support message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      required
                      value={form.substituteId}
                      onChange={e => setForm(prev => ({ ...prev, substituteId: e.target.value }))}
                      disabled={!form.athleteId}
                      className="w-full px-3 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:ring-2 focus:ring-accent-blue/40 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">{form.athleteId ? 'Select a substitute' : 'Select an athlete first'}</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.position}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">
                    Reason
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Athlete metrics indicate high fatigue..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 resize-none focus:ring-2 focus:ring-accent-blue/40 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !form.substituteId}
                  className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {submitting ? 'Sending...' : 'Send Substitution Request'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
