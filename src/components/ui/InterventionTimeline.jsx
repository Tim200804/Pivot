import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Circle, Loader2, AlertCircle, User, FileText } from 'lucide-react'
import { apiListInterventions } from '../../config/api'

const TYPE_LABELS = {
  conversation: 'Conversation',
  training_adjustment: 'Training Adjustment',
  rest_day: 'Rest Day',
  mental_skill: 'Mental Skill',
  nutrition: 'Nutrition',
  sleep_hygiene: 'Sleep Hygiene',
  medical_referral: 'Medical Referral',
  other: 'Other',
}

const STATUS_COLORS = {
  planned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-accent-blue/10 text-accent-blue',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function InterventionTimeline({ alertId, athleteId, onEdit, compact = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiListInterventions({ alertId, athleteId, limit: 50 })
      .then(data => {
        if (cancelled) return
        setItems(data.interventions || [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [alertId, athleteId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={20} className="text-accent-blue animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-pivot-50 dark:bg-slate-800/30 text-center">
        <p className="text-xs text-pivot-500 dark:text-slate-400">No interventions recorded yet.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${compact ? '' : 'pl-2 border-l-2 border-pivot-100 dark:border-slate-700/50'}`}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative"
        >
          {!compact && (
            <span className="absolute -left-[calc(0.5rem+2px)] top-2 w-2.5 h-2.5 rounded-full bg-accent-teal ring-4 ring-pivot-50 dark:ring-slate-900" />
          )}
          <div className="glass-card p-3.5 hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                {item.status === 'in_progress' && <Clock size={14} className="text-accent-blue" />}
                {item.status === 'planned' && <Circle size={14} className="text-amber-500" />}
                {item.status === 'cancelled' && <AlertCircle size={14} className="text-slate-400" />}
                <span className="text-xs font-semibold text-pivot-800 dark:text-slate-200">
                  {TYPE_LABELS[item.interventionType] || item.interventionType}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.planned}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="text-[10px] text-accent-teal hover:underline shrink-0"
                >
                  Edit
                </button>
              )}
            </div>

            <p className="text-xs text-pivot-600 dark:text-slate-300 mt-2 leading-relaxed">
              {item.description}
            </p>

            {item.actionsTaken?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {item.actionsTaken.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-pivot-500 dark:text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-accent-teal mt-1.5 shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            )}

            {(item.effectivenessScore || item.outcomeNotes) && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Outcome</span>
                  {item.effectivenessScore && (
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      Effectiveness: {item.effectivenessScore}/5
                    </span>
                  )}
                </div>
                {item.outcomeNotes && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    {item.outcomeNotes}
                  </p>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center gap-3 text-[10px] text-pivot-400">
              <span className="flex items-center gap-1">
                <User size={10} />
                {item.coachName || 'Coach'}
              </span>
              <span>{new Date(item.startedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
