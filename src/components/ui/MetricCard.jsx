import { motion } from 'framer-motion'

export default function MetricCard({ icon: Icon, label, value, unit, trend, trendValue, color = 'blue', onClick, large }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-accent-blue', dot: 'bg-accent-blue' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-accent-teal', dot: 'bg-accent-teal' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', dot: 'bg-amber-500' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', dot: 'bg-rose-500' },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-5 text-left w-full ${large ? 'col-span-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.text} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
            trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
            'bg-pivot-100 dark:bg-slate-700 text-pivot-500 dark:text-slate-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="metric-value text-pivot-900 dark:text-white">
        {value}
        {unit && <span className="text-sm font-normal text-pivot-400 dark:text-slate-500 ml-1">{unit}</span>}
      </div>
      <div className="metric-label mt-1">{label}</div>
    </motion.button>
  )
}
