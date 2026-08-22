import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Watch, Heart, Activity, Moon, ArrowRight, CheckCircle2, Smartphone,
  ShieldCheck, Upload, FileSpreadsheet, AlertTriangle, Download, X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import * as XLSX from 'xlsx'

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

// Feature flag: set VITE_ENABLE_APPLE_HEALTH=true to show Apple Watch cards.
// Otherwise the onboarding presents an Excel/CSV import card instead.
const ENABLE_APPLE_HEALTH = import.meta.env.VITE_ENABLE_APPLE_HEALTH === 'true'

const APPLE_STEPS = ['connect', 'permissions', 'checkin', 'complete']
const IMPORT_STEPS = ['import', 'checkin', 'complete']

const REQUIRED_COLUMNS = ['date', 'hrv', 'rhr', 'sleepHours']
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']
const ACCEPTED_FORMATS_LABEL = '.xlsx, .xls, .csv'

const TEMPLATE_SAMPLE_ROWS = [
  { date: '2026-08-16', hrv: 58, rhr: 54, sleepHours: 7.2 },
  { date: '2026-08-17', hrv: 55, rhr: 55, sleepHours: 6.8 },
  { date: '2026-08-18', hrv: 52, rhr: 56, sleepHours: 6.5 },
  { date: '2026-08-19', hrv: 49, rhr: 57, sleepHours: 6.2 },
  { date: '2026-08-20', hrv: 47, rhr: 58, sleepHours: 5.8 },
  { date: '2026-08-21', hrv: 44, rhr: 59, sleepHours: 5.5 },
  { date: '2026-08-22', hrv: 42, rhr: 60, sleepHours: 5.2 },
]

function getFileExtension(filename) {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
}

function isAcceptedImportFile(file) {
  if (!file?.name) return false
  return ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name))
}

function downloadHealthTemplate() {
  const sheet = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_ROWS)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Health Data')
  XLSX.writeFile(workbook, 'pivot-health-import-template.xlsx')
}

function normalizeHeaders(headers) {
  const map = {}
  headers.forEach(h => {
    const key = String(h).trim().toLowerCase()
    map[key] = h
  })
  return map
}

function parseDateValue(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().split('T')[0]
  }
  if (typeof value === 'number') {
    // Excel serial date
    try {
      const { y, m, d } = XLSX.SSF.parse_date_code(value)
      return new Date(y, m - 1, d).toISOString().split('T')[0]
    } catch {
      return null
    }
  }
  const s = String(value).trim()
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

function headerKey(headerMap, column) {
  return headerMap[column.toLowerCase()]
}

function validateHealthSheet(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { errors: ['The uploaded file is empty.'], rows: [] }
  }

  const rawHeaders = Object.keys(rows[0])
  const headerMap = normalizeHeaders(rawHeaders)
  const missing = REQUIRED_COLUMNS.filter(c => !(c.toLowerCase() in headerMap))
  if (missing.length > 0) {
    return { errors: [`Missing required columns: ${missing.join(', ')}`], rows: [] }
  }

  const errors = []
  const validated = []

  rows.forEach((row, idx) => {
    const rowNum = idx + 2 // +1 header, +1 1-based
    const date = parseDateValue(row[headerKey(headerMap, 'date')])
    if (!date) errors.push(`Row ${rowNum}: date is invalid.`)

    const hrv = Number(row[headerKey(headerMap, 'hrv')])
    if (!Number.isFinite(hrv) || hrv <= 0) {
      errors.push(`Row ${rowNum}: hrv must be a positive number.`)
    }

    const rhr = Number(row[headerKey(headerMap, 'rhr')])
    if (!Number.isFinite(rhr) || rhr <= 0) {
      errors.push(`Row ${rowNum}: rhr must be a positive number.`)
    }

    const sleepHours = Number(row[headerKey(headerMap, 'sleepHours')])
    if (!Number.isFinite(sleepHours) || sleepHours <= 0) {
      errors.push(`Row ${rowNum}: sleepHours must be a positive number.`)
    }

    if (errors.every(e => !e.startsWith(`Row ${rowNum}`))) {
      validated.push({ date, hrv, rhr, sleepHours })
    }
  })

  return errors.length > 0 ? { errors, rows: [] } : { errors: [], rows: validated }
}

export default function AthleteOnboarding({ onComplete }) {
  const { user } = useUser()
  const steps = ENABLE_APPLE_HEALTH ? APPLE_STEPS : IMPORT_STEPS
  const [step, setStep] = useState(steps[0])
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [permissions, setPermissions] = useState({
    heartRate: true,
    hrv: true,
    sleep: true,
    workouts: true,
  })
  const [checkin, setCheckin] = useState({
    mood: 3,
    motivation: 7,
    fatigue: 4,
    journal: '',
  })

  // Excel/CSV import state
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importCount, setImportCount] = useState(0)
  const [importErrors, setImportErrors] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [invalidFileModal, setInvalidFileModal] = useState(null)
  const fileInputRef = useRef(null)
  const dragDepthRef = useRef(0)

  const navigate = useNavigate()

  const currentStepIndex = steps.indexOf(step)

  const showInvalidFileModal = useCallback((file) => {
    setInvalidFileModal({
      name: file?.name || 'Unknown file',
      ext: getFileExtension(file?.name || ''),
    })
  }, [])

  const processImportFile = useCallback(async (file) => {
    if (!file) return
    if (!isAcceptedImportFile(file)) {
      showInvalidFileModal(file)
      return
    }

    setImportFile(file)
    setImporting(true)
    setImported(false)
    setImportCount(0)
    setImportErrors([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      const result = validateHealthSheet(rows)

      if (result.errors.length > 0) {
        setImportErrors(result.errors)
      } else {
        setImported(true)
        setImportCount(result.rows.length)
        localStorage.setItem('pivot_imported_health', JSON.stringify(result.rows))
      }
    } catch (err) {
      setImportErrors([err.message || 'Failed to read the uploaded file.'])
    } finally {
      setImporting(false)
    }
  }, [showInvalidFileModal])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processImportFile(file)
    e.target.value = ''
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current -= 1
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    processImportFile(file)
  }

  const handleConnect = () => {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      setTimeout(() => setStep('permissions'), 800)
    }, 1800)
  }

  const handleComplete = () => {
    if (onComplete) onComplete()
    navigate('/athlete')
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface-light dark:bg-surface-dark p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                currentStepIndex >= i ? 'bg-accent-blue text-white' : 'bg-pivot-100 dark:bg-slate-700 text-pivot-400'
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-colors ${
                  currentStepIndex > i ? 'bg-accent-blue' : 'bg-pivot-100 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {ENABLE_APPLE_HEALTH && step === 'connect' && (
            <motion.div key="connect" variants={slide} initial="initial" animate="animate" exit="exit" className="glass-card p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-5">
                <Watch size={36} className="text-accent-blue" />
              </div>
              <h2 className="text-xl font-bold text-pivot-900 dark:text-white mb-2">Connect Your Apple Watch</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mb-6 leading-relaxed">
                Pivot reads heart rate variability, sleep, and workout data from Apple Health.
                <span className="block mt-2 text-xs text-pivot-400">Demo mode: no real data is accessed in this preview.</span>
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <Heart size={18} className="text-rose-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-pivot-700 dark:text-slate-200">Heart Rate & HRV</p>
                    <p className="text-[10px] text-pivot-400">Detect recovery stress before symptoms appear</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <Moon size={18} className="text-indigo-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-pivot-700 dark:text-slate-200">Sleep Duration</p>
                    <p className="text-[10px] text-pivot-400">Track the biggest predictor of next-day performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
                  <Activity size={18} className="text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-pivot-700 dark:text-slate-200">Workouts</p>
                    <p className="text-[10px] text-pivot-400">Water + erg sessions sync automatically</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || connected}
                className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching for Apple Watch...
                  </>
                ) : connected ? (
                  <>
                    <CheckCircle2 size={18} /> Connected
                  </>
                ) : (
                  <>
                    Connect Apple Watch <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('permissions')}
                className="mt-3 text-xs text-pivot-400 hover:text-pivot-600 dark:hover:text-slate-300"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {ENABLE_APPLE_HEALTH && step === 'permissions' && (
            <motion.div key="permissions" variants={slide} initial="initial" animate="animate" exit="exit" className="glass-card p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck size={30} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-pivot-900 dark:text-white mb-2 text-center">Health Data Access</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mb-6 text-center leading-relaxed">
                You control what Pivot can read. Toggle categories on or off.
              </p>

              <div className="space-y-2 mb-6">
                {[
                  { key: 'heartRate', label: 'Heart Rate & HRV', icon: Heart, color: 'text-rose-500' },
                  { key: 'sleep', label: 'Sleep Analysis', icon: Moon, color: 'text-indigo-500' },
                  { key: 'workouts', label: 'Workouts (Rowing, Erg, Cross-Training)', icon: Activity, color: 'text-emerald-500' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={`shrink-0 ${color}`} />
                      <span className="text-sm font-medium text-pivot-700 dark:text-slate-200">{label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-5 h-5 accent-accent-blue rounded"
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => setStep('checkin')}
                className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {!ENABLE_APPLE_HEALTH && step === 'import' && (
            <motion.div key="import" variants={slide} initial="initial" animate="animate" exit="exit" className="glass-card p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-5">
                <FileSpreadsheet size={36} className="text-accent-blue" />
              </div>
              <h2 className="text-xl font-bold text-pivot-900 dark:text-white mb-2">Import Your Health Data</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mb-6 leading-relaxed">
                Apple Health requires an Apple-certified integration, so Pivot accepts a spreadsheet upload instead.
                Your daily check-in still follows this step.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 p-4 rounded-xl bg-pivot-50 dark:bg-slate-800/50 text-left">
                <div className="text-xs text-pivot-600 dark:text-slate-300">
                  <p className="font-semibold mb-1">Download the import template</p>
                  <p className="text-[10px] text-pivot-400 leading-relaxed">
                    Includes sample rows for {REQUIRED_COLUMNS.join(', ')}. Accepted formats: {ACCEPTED_FORMATS_LABEL}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadHealthTemplate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-pivot-200 dark:border-slate-600 text-xs font-semibold text-accent-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0"
                >
                  <Download size={14} />
                  Download template
                </button>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full py-8 mb-4 border-2 border-dashed rounded-xl cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 ${
                  isDragging
                    ? 'border-accent-blue bg-blue-50/60 dark:bg-blue-900/20 scale-[1.01]'
                    : 'border-pivot-200 dark:border-slate-600 hover:border-accent-blue/60 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                }`}
              >
                <Upload size={28} className={`mb-2 transition-colors ${isDragging ? 'text-accent-blue' : 'text-pivot-400 group-hover:text-accent-blue'}`} />
                <span className="text-sm text-pivot-600 dark:text-slate-300">
                  {isDragging
                    ? 'Drop your file here'
                    : importFile
                      ? importFile.name
                      : 'Drag & drop or click to upload'}
                </span>
                <span className="text-[10px] text-pivot-400 mt-1">{ACCEPTED_FORMATS_LABEL}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {importing && (
                <div className="flex items-center justify-center gap-2 mb-4 text-xs text-pivot-500">
                  <span className="w-4 h-4 border-2 border-pivot-300 border-t-accent-blue rounded-full animate-spin" />
                  Validating your data…
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="text-left mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold mb-2">
                    <AlertTriangle size={14} /> Validation failed
                  </div>
                  <ul className="list-disc pl-4 space-y-1 max-h-32 overflow-y-auto">
                    {importErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {imported && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <CheckCircle2 size={14} /> Import validated
                  </div>
                  <p>{importCount} row{importCount === 1 ? '' : 's'} ready to use.</p>
                </div>
              )}

              <button
                onClick={() => setStep('checkin')}
                disabled={!imported}
                className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Check-in <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setStep('checkin')}
                className="mt-3 text-xs text-pivot-400 hover:text-pivot-600 dark:hover:text-slate-300"
              >
                Skip import for now
              </button>
            </motion.div>
          )}

          {step === 'checkin' && (
            <motion.div key="checkin" variants={slide} initial="initial" animate="animate" exit="exit" className="glass-card p-8">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
                <Smartphone size={30} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-pivot-900 dark:text-white mb-2 text-center">Your First Check-in</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mb-6 text-center leading-relaxed">
                This takes 20 seconds. Your honest input is what makes Pivot valuable.
              </p>

              <div className="space-y-5 mb-6">
                <div>
                  <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-2">Mood right now</label>
                  <div className="flex justify-between gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        onClick={() => setCheckin(prev => ({ ...prev, mood: n }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                          checkin.mood === n
                            ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-blue-500/20'
                            : 'border-pivot-200 dark:border-slate-600 text-pivot-400 hover:border-accent-blue/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-pivot-400 mt-1.5 text-center">
                    {checkin.mood <= 2 ? 'Struggling' : checkin.mood === 3 ? 'Okay' : 'Good'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-2">
                    Motivation <span className="text-pivot-400 font-normal">{checkin.motivation}/10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkin.motivation}
                    onChange={e => setCheckin(prev => ({ ...prev, motivation: parseInt(e.target.value) }))}
                    className="w-full accent-accent-blue h-2 bg-pivot-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-pivot-600 dark:text-slate-400 mb-2">
                    Fatigue <span className="text-pivot-400 font-normal">{checkin.fatigue}/10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={checkin.fatigue}
                    onChange={e => setCheckin(prev => ({ ...prev, fatigue: parseInt(e.target.value) }))}
                    className="w-full accent-rose-500 h-2 bg-pivot-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <textarea
                  value={checkin.journal}
                  onChange={e => setCheckin(prev => ({ ...prev, journal: e.target.value }))}
                  placeholder="Anything on your mind? (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 resize-none h-20 focus:ring-2 focus:ring-accent-blue/40 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setStep('complete')}
                className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Save Check-in <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div key="complete" variants={slide} initial="initial" animate="animate" exit="exit" className="glass-card p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-pivot-900 dark:text-white mb-2">You're all set, {user?.name?.split(' ')[0] || 'Athlete'}</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mb-6 leading-relaxed">
                Pivot now has a baseline. Your dashboard will update as new data comes in.
              </p>

              <div className="bg-pivot-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs text-pivot-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {ENABLE_APPLE_HEALTH ? 'Apple Watch connected (demo)' : 'Health data imported'}
                </div>
                <div className="flex items-center gap-2 text-xs text-pivot-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500" /> First check-in saved
                </div>
                <div className="flex items-center gap-2 text-xs text-pivot-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Coach will be notified of significant changes
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {invalidFileModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setInvalidFileModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2 }}
                className="glass-card w-full max-w-sm p-6 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-amber-500" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvalidFileModal(null)}
                    className="p-1 rounded-lg text-pivot-400 hover:text-pivot-600 dark:hover:text-slate-300 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h3 className="text-base font-bold text-pivot-900 dark:text-white mb-2">Unsupported file type</h3>
                <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed mb-1">
                  <span className="font-medium">{invalidFileModal.name}</span>
                  {invalidFileModal.ext
                    ? ` (${invalidFileModal.ext})`
                    : ' has no recognized extension'}
                  {' '}cannot be imported.
                </p>
                <p className="text-xs text-pivot-500 dark:text-slate-400 mb-5">
                  Please upload a spreadsheet in one of these formats: {ACCEPTED_FORMATS_LABEL}
                </p>
                <button
                  type="button"
                  onClick={() => setInvalidFileModal(null)}
                  className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
