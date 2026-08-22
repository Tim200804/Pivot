import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, UserCheck, UserX, Send, Loader2, AlertCircle,
  CheckCircle2, XCircle, Clock, Users, MessageSquare,
} from 'lucide-react'
import { useUser } from '../../context/UserContext'
import {
  apiListSubstitutionRequests,
  apiListSubstitutionCandidates,
  apiCreateSubstitutionRequest,
  apiRespondSubstitutionRequest,
} from '../../config/api'

const statusMeta = {
  pending_teammate: { label: 'Waiting for teammate', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  teammate_accepted: { label: 'Teammate accepted — awaiting coach', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle2 },
  teammate_rejected: { label: 'Teammate declined', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', icon: XCircle },
  coach_approved: { label: 'Approved by coach', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  coach_rejected: { label: 'Not approved by coach', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', icon: XCircle },
}

export default function AthleteSubstitutionPage() {
  const { user } = useUser()
  const [tab, setTab] = useState('request') // 'request' | 'list'
  const [requests, setRequests] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ trainingDate: '', reason: '', substituteId: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [reqRes, candRes] = await Promise.all([
        apiListSubstitutionRequests(),
        apiListSubstitutionCandidates(),
      ])
      setRequests(reqRes?.requests || [])
      setCandidates(candRes?.candidates || [])
    } catch (err) {
      setError(err.message || 'Failed to load substitution data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const myRequests = useMemo(() => requests.filter(r => r.requesterId === user?.id), [requests, user])
  const incomingRequests = useMemo(() => requests.filter(r => r.substituteId === user?.id && r.status === 'pending_teammate'), [requests, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.trainingDate || !form.substituteId) {
      setError('Please select a training date and a substitute')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiCreateSubstitutionRequest(form)
      if (res.success) {
        setSuccess('Substitution request sent to your teammate and coach')
        setForm({ trainingDate: '', reason: '', substituteId: '' })
        await load()
        setTab('list')
      } else {
        setError(res.message || 'Failed to create request')
      }
    } catch (err) {
      if (err.noSubstitute) {
        setError('No substitute is available for your position right now.')
      } else {
        setError(err.message || 'Failed to create request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = async (id, accept) => {
    try {
      await apiRespondSubstitutionRequest(id, accept)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to respond')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-surface-light dark:bg-surface-dark p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-pivot-900 dark:text-white">Leave & Substitution</h1>
          <p className="text-sm text-pivot-500 dark:text-slate-400">
            Request a teammate to cover your position when you need to miss training.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'request', label: 'Request Substitution' },
            { key: 'list', label: `My Requests ${myRequests.length > 0 ? `(${myRequests.length})` : ''}` },
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
          {tab === 'request' && (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-bold text-pivot-900 dark:text-white mb-4 flex items-center gap-2">
                <Send size={20} className="text-accent-blue" />
                New Substitution Request
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    Reason
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Feeling unwell, need to rest..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 resize-none focus:ring-2 focus:ring-accent-blue/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">
                    Choose a Substitute <span className="text-red-400">*</span>
                  </label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-pivot-400 py-3">
                      <Loader2 size={16} className="animate-spin" /> Loading teammates...
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      No teammate shares your position. You cannot create a substitution request right now.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {candidates.map(c => (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            form.substituteId === String(c.id)
                              ? 'border-accent-blue bg-blue-50 dark:bg-blue-900/20'
                              : 'border-pivot-200 dark:border-slate-600 hover:border-accent-blue/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="substitute"
                            value={c.id}
                            checked={form.substituteId === String(c.id)}
                            onChange={e => setForm(prev => ({ ...prev, substituteId: e.target.value }))}
                            className="accent-accent-blue w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-pivot-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-pivot-500 dark:text-slate-400">{c.position}</p>
                          </div>
                          {form.substituteId === String(c.id) && <UserCheck size={18} className="text-accent-blue" />}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || candidates.length === 0}
                  className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {incomingRequests.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-bold text-pivot-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-accent-blue" />
                    Teammate Needs You
                  </h2>
                  <div className="space-y-3">
                    {incomingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-pivot-100 dark:border-slate-700 bg-pivot-50/50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-pivot-900 dark:text-white">
                              {req.requesterName} asked you to cover {req.position}
                            </p>
                            <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                              Date: {req.trainingDate}
                            </p>
                            {req.reason && (
                              <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                                Reason: {req.reason}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleRespond(req.id, true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1"
                            >
                              <UserCheck size={14} /> Cover
                            </button>
                            <button
                              onClick={() => handleRespond(req.id, false)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors flex items-center gap-1"
                            >
                              <UserX size={14} /> Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card p-6">
                <h2 className="text-lg font-bold text-pivot-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-accent-blue" />
                  My Requests
                </h2>
                {myRequests.length === 0 ? (
                  <p className="text-sm text-pivot-500 dark:text-slate-400 py-4 text-center">
                    You haven't created any substitution requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(req => {
                      const meta = statusMeta[req.status] || statusMeta.pending_teammate
                      const Icon = meta.icon
                      return (
                        <div
                          key={req.id}
                          className="p-4 rounded-xl border border-pivot-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-pivot-900 dark:text-white">
                                {req.position} — {req.trainingDate}
                              </p>
                              {req.substituteName && (
                                <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                                  Substitute: {req.substituteName}
                                </p>
                              )}
                              {req.reason && (
                                <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                                  Reason: {req.reason}
                                </p>
                              )}
                              {req.coachNote && (
                                <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                                  Coach note: {req.coachNote}
                                </p>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${meta.color}`}>
                              <Icon size={12} />
                              {meta.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
