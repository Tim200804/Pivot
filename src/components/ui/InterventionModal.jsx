import { motion } from 'framer-motion'
import { X, Calendar, Activity, Eye, Shield, MessageCircle, CheckCircle } from 'lucide-react'
import { getInterventionSuggestions } from '../../utils/intervention'

const ICONS = {
  message: MessageCircle,
  calendar: Calendar,
  activity: Activity,
  eye: Eye,
  shield: Shield,
}

export default function InterventionModal({ alert, athlete, isOpen, onClose, onDismiss, onSendNudge }) {
  if (!isOpen || !alert || !athlete) return null

  const suggestions = getInterventionSuggestions(alert, athlete)
  const firstName = athlete.name.split(' ')[0]

  const handleAction = (suggestion) => {
    if (suggestion.action === 'nudge') {
      onSendNudge(suggestion)
    } else {
      // For non-nudge actions, just mark as actioned with the action type
      onDismiss && onDismiss()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-pivot-900 dark:text-white">
              Suggested Intervention
            </h3>
            <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
              {alert.type} · {athlete.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} className="text-pivot-400" />
          </button>
        </div>

        {/* Alert context */}
        <div className={`p-3 rounded-xl mb-5 ${
          alert.level === 'black' ? 'bg-slate-100 dark:bg-slate-800/50' :
          alert.level === 'red' ? 'bg-red-50 dark:bg-red-900/10' :
          'bg-amber-50 dark:bg-amber-900/10'
        }`}>
          <p className="text-xs text-pivot-600 dark:text-slate-300">{alert.message}</p>
        </div>

        {/* Intervention options */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-pivot-500 dark:text-slate-400 uppercase tracking-wider">
            AI Recommended Actions
          </p>
          {suggestions.map((suggestion, i) => {
            const Icon = ICONS[suggestion.icon] || MessageCircle
            return (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => handleAction(suggestion)}
                className={`w-full p-4 rounded-2xl border text-left transition-all hover:shadow-md active:scale-[0.98] ${
                  suggestion.urgent
                    ? 'border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:bg-pivot-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    suggestion.urgent
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <Icon size={18} className={suggestion.urgent ? 'text-red-500' : 'text-accent-blue'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${
                        suggestion.urgent ? 'text-red-700 dark:text-red-300' : 'text-pivot-700 dark:text-slate-200'
                      }`}>
                        {suggestion.title}
                      </p>
                      {suggestion.urgent && (
                        <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pivot-500 dark:text-slate-400 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Dismiss option */}
        <button
          onClick={() => { onDismiss && onDismiss(); onClose() }}
          className="w-full mt-4 py-2.5 rounded-xl border border-pivot-200 dark:border-slate-600 text-sm text-pivot-500 dark:text-slate-400 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          Dismiss without action
        </button>
      </motion.div>
    </motion.div>
  )
}
