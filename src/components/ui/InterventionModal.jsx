import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, ClipboardList, CheckCircle2 } from 'lucide-react'

const INTERVENTION_TYPES = [
  { value: 'conversation', label: 'Conversation' },
  { value: 'training_adjustment', label: 'Training Adjustment' },
  { value: 'rest_day', label: 'Rest Day' },
  { value: 'mental_skill', label: 'Mental Skill' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'sleep_hygiene', label: 'Sleep Hygiene' },
  { value: 'medical_referral', label: 'Medical Referral' },
  { value: 'other', label: 'Other' },
]

export default function InterventionModal({ alert, athlete, onClose, onSaved, initialData = null }) {
  const isEdit = Boolean(initialData)
  const [form, setForm] = useState({
    interventionType: initialData?.interventionType || 'conversation',
    description: initialData?.description || '',
    actionsTaken: initialData?.actionsTaken?.join('\n') || '',
    status: initialData?.status || 'planned',
    effectivenessScore: initialData?.effectivenessScore || '',
    outcomeNotes: initialData?.outcomeNotes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        interventionType: initialData.interventionType || 'conversation',
        description: initialData.description || '',
        actionsTaken: Array.isArray(initialData.actionsTaken) ? initialData.actionsTaken.join('\n') : (initialData.actionsTaken || ''),
        status: initialData.status || 'planned',
        effectivenessScore: initialData.effectivenessScore ?? '',
        outcomeNotes: initialData.outcomeNotes || '',
      })
    }
  }, [initialData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        alert_id: alert?.id,
        athlete_id: athlete?.id || alert?.athleteId,
        intervention_type: form.interventionType,
        description: form.description,
        actions_taken: form.actionsTaken.split('\n').map(s => s.trim()).filter(Boolean),
        status: form.status,
        effectiveness_score: form.effectivenessScore ? Number(form.effectivenessScore) : null,
        outcome_notes: form.outcomeNotes,
      }
      await onSaved(payload, initialData?.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save intervention')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card rounded-2xl shadow-2xl border border-pivot-200 dark:border-slate-600 w-full max-w-lg flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-pivot-100 dark:border-slate-700/30">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-accent-teal" />
              <h3 className="text-sm font-semibold text-pivot-900 dark:text-white">
                {isEdit ? 'Edit Intervention' : 'Log Intervention'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-pivot-400 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Athlete</label>
              <div className="px-3 py-2 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-sm text-pivot-900 dark:text-white">
                {athlete?.name || alert?.athleteName || '—'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Intervention Type</label>
              <select
                value={form.interventionType}
                onChange={(e) => setForm({ ...form, interventionType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
              >
                {INTERVENTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="What did you observe and decide to do?"
                className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Actions Taken</label>
              <textarea
                value={form.actionsTaken}
                onChange={(e) => setForm({ ...form, actionsTaken: e.target.value })}
                rows={3}
                placeholder="One action per line"
                className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Effectiveness (1-5)</label>
                <select
                  value={form.effectivenessScore}
                  onChange={(e) => setForm({ ...form, effectivenessScore: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                >
                  <option value="">—</option>
                  <option value="1">1 — No effect</option>
                  <option value="2">2 — Minimal</option>
                  <option value="3">3 — Some help</option>
                  <option value="4">4 — Effective</option>
                  <option value="5">5 — Very effective</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pivot-700 dark:text-slate-300 mb-1.5">Outcome Notes</label>
              <textarea
                value={form.outcomeNotes}
                onChange={(e) => setForm({ ...form, outcomeNotes: e.target.value })}
                rows={2}
                placeholder="How did the athlete respond?"
                className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 resize-none"
              />
            </div>
          </form>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-pivot-100 dark:border-slate-700/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-pivot-600 dark:text-slate-300 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-accent-teal text-white text-xs font-medium hover:bg-teal-600 transition-colors active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {loading ? 'Saving…' : (isEdit ? 'Update' : 'Log Intervention')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
