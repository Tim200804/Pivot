import { memo } from 'react'

const config = {
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'alert-dot alert-dot-yellow',
    label: 'Monitor',
    border: 'border-amber-200 dark:border-amber-800/30',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    dot: 'alert-dot alert-dot-red',
    label: 'Warning',
    border: 'border-red-200 dark:border-red-800/30',
  },
  black: {
    bg: 'bg-slate-800 dark:bg-slate-200',
    text: 'text-white dark:text-slate-900',
    dot: 'alert-dot alert-dot-black',
    label: 'Urgent',
    border: 'border-slate-700 dark:border-slate-300',
  },
}

const AlertBadge = memo(function AlertBadge({ level, className = '' }) {
  const c = config[level] || config.yellow

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} ${c.border} border ${className}`}>
      <span className={c.dot} />
      {c.label}
    </span>
  )
})

export default AlertBadge

const statusConfig = {
  good: { className: 'status-pill status-pill-good', label: 'Good' },
  warning: { className: 'status-pill status-pill-warning', label: 'At Risk' },
  danger: { className: 'status-pill status-pill-danger', label: 'Critical' },
  urgent: { className: 'status-pill status-pill-danger', label: 'URGENT' },
}

export const StatusPill = memo(function StatusPill({ status }) {
  const c = statusConfig[status] || statusConfig.good

  return (
    <span className={c.className}>
      <span className={`alert-dot ${status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'alert-dot-yellow' : 'alert-dot-red'}`} />
      {c.label}
    </span>
  )
})
