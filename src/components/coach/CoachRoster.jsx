import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, XCircle, Activity, Heart, Moon, Users, GraduationCap, Ruler, Weight, LayoutGrid, List, Download, CheckSquare, Square, CheckCircle2 } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import AlertBadge, { StatusPill } from '../ui/AlertBadge'
import HealthTrendChart from '../ui/HealthTrendChart'
import { useTheme } from '../../context/ThemeContext'
import { useAlerts } from '../../context/AlertContext'

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

export default function CoachRoster() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { athletes, alerts } = useAlerts()
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }

  const filtered = searchQuery
    ? athletes.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.school?.toLowerCase().includes(searchQuery.toLowerCase()))
    : athletes

  const sortedByAlert = [...filtered].sort((a, b) => {
    const order = { urgent: 0, danger: 1, warning: 2, good: 3 }
    return (order[a.status] ?? 4) - (order[b.status] ?? 4)
  })

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedByAlert.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedByAlert.map(a => a.id)))
    }
  }

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? sortedByAlert.filter(a => selectedIds.has(a.id))
      : sortedByAlert

    const csv = [
      'Name,School,Team,Position,Status,HRV,RHR,Sleep,Height,Weight,Age',
      ...toExport.map(a =>
        `${a.name},${a.school},${a.team},${a.position},${a.status},${a.currentHRV},${a.currentRHR},${a.currentSleep},${a.height},${a.weight},${a.age}`
      ),
    ].join('\n')

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roster_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${toExport.length} athlete${toExport.length > 1 ? 's' : ''}`)
  }

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role="coach" />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Athlete Roster</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">
                {athletes.length} athletes across 2 schools
                {selectedIds.size > 0 && <span className="text-accent-teal font-medium"> · {selectedIds.size} selected</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pivot-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or school..."
                  className="pl-9 pr-4 py-2 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 w-56"
                />
              </div>
              <div className="flex items-center rounded-2xl border border-pivot-200 dark:border-slate-600 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-teal/10 text-accent-teal' : 'text-pivot-400 hover:bg-pivot-50 dark:hover:bg-slate-700/50'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-teal/10 text-accent-teal' : 'text-pivot-400 hover:bg-pivot-50 dark:hover:bg-slate-700/50'}`}
                >
                  <List size={16} />
                </button>
              </div>
              {/* Export button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-pivot-200 dark:border-slate-600 text-sm text-pivot-500 dark:text-slate-400 hover:bg-pivot-50 dark:hover:bg-slate-700/50 hover:text-accent-teal transition-colors active:scale-95"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </motion.div>

          {/* Batch actions bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <button onClick={toggleSelectAll} className="text-xs text-pivot-500 dark:text-slate-400 hover:text-accent-teal font-medium flex items-center gap-1">
                    {selectedIds.size === sortedByAlert.length ? <CheckSquare size={14} /> : <Square size={14} />}
                    {selectedIds.size === sortedByAlert.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-xs text-pivot-400">{selectedIds.size} athlete{selectedIds.size > 1 ? 's' : ''} selected</span>
                </div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-pivot-400 hover:text-rose-500 transition-colors font-medium"
                >
                  Clear selection
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Roster Grid/List */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
          }>
            {sortedByAlert.map((athlete, i) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                className="w-full glass-card p-4 hover:shadow-elevated transition-all group relative"
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(athlete.id) }}
                  className="absolute top-3 right-3 z-10 p-1 rounded-lg hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {selectedIds.has(athlete.id)
                    ? <CheckSquare size={18} className="text-accent-teal" />
                    : <Square size={18} className="text-pivot-300 dark:text-slate-600" />
                  }
                </button>

                <button onClick={() => setSelectedAthlete(athlete)} className="w-full text-left">
                  <div className="flex items-start gap-4 pr-8">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      athlete.status === 'urgent' ? 'bg-slate-800 dark:bg-slate-200' :
                      athlete.status === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20' :
                      athlete.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                      'bg-emerald-50 dark:bg-emerald-900/20'
                    }`}>
                      <span className={`text-base font-bold ${
                        athlete.status === 'urgent' ? 'text-white dark:text-slate-900' :
                        athlete.status === 'danger' ? 'text-rose-500' :
                        athlete.status === 'warning' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {athlete.name?.split(' ').map(n => n[0]).join('') || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-pivot-900 dark:text-white">{athlete.name}</span>
                        <StatusPill status={athlete.status} />
                        {athlete.recovering && <span className="status-pill status-pill-warning text-[10px]">Recovering</span>}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-pivot-400 dark:text-slate-500 mb-1">
                        <GraduationCap size={10} className="shrink-0" />
                        <span className="truncate">{athlete.school} · {athlete.team}</span>
                      </div>

                      <p className="text-xs text-pivot-500 dark:text-slate-400 mb-2">
                        <span className="truncate">{athlete.position} · {athlete.height}cm / {athlete.weight}kg · Age {athlete.age}</span>
                      </p>

                      <div className="flex gap-4 text-xs">
                        <span className="text-pivot-400">HRV <span className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentHRV}</span></span>
                        <span className="text-pivot-400">RHR <span className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentRHR}</span></span>
                        <span className="text-pivot-400">Sleep <span className="font-semibold text-pivot-700 dark:text-slate-300">{athlete.currentSleep}h</span></span>
                      </div>

                      {alerts.filter(a => a.athleteId === athlete.id).length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {alerts.filter(a => a.athleteId === athlete.id).map((a, j) => (
                            <AlertBadge key={j} level={a.level} />
                          ))}
                        </div>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-pivot-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          <div className="h-4" />
        </main>
      </div>

      {/* Athlete Detail Modal */}
      <AnimatePresence>
        {selectedAthlete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedAthlete(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedAthlete.status === 'urgent' ? 'bg-slate-800 dark:bg-slate-200' :
                    selectedAthlete.status === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20' :
                    selectedAthlete.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    'bg-emerald-50 dark:bg-emerald-900/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      selectedAthlete.status === 'urgent' ? 'text-white dark:text-slate-900' :
                      selectedAthlete.status === 'danger' ? 'text-rose-500' :
                      selectedAthlete.status === 'warning' ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      {selectedAthlete.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-pivot-900 dark:text-white">{selectedAthlete.name}</h3>
                    <p className="text-xs text-pivot-400">{selectedAthlete.school} · {selectedAthlete.team}</p>
                    <p className="text-xs text-pivot-400">{selectedAthlete.position} · {selectedAthlete.height}cm / {selectedAthlete.weight}kg · Age {selectedAthlete.age}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAthlete(null)} className="p-2 rounded-xl hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors active:scale-90">
                  <XCircle size={20} className="text-pivot-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentHRV}</p>
                  <p className="text-[10px] text-pivot-400">HRV (ms)</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentRHR}</p>
                  <p className="text-[10px] text-pivot-400">RHR (bpm)</p>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/10 text-center">
                  <p className="text-xl font-bold text-pivot-900 dark:text-white">{selectedAthlete.currentSleep}h</p>
                  <p className="text-[10px] text-pivot-400">Sleep</p>
                </div>
              </div>

              <HealthTrendChart data={selectedAthlete.health} title="Health Trends" metrics={['hrv', 'rhr', 'sleepHours']} darkMode={isDark} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
