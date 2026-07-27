import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShipWheel, Dumbbell, Search, GraduationCap, Users, Ruler, Weight, ChevronDown, CheckCircle2, Lock, Loader2 } from 'lucide-react'
import { useUser, COACH_ROLES } from '../../context/UserContext'
import { isMockMode } from '../../config/api'
import { apiSearchSchools, apiCheckEmail, apiGetOptions } from '../../config/api'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const glassInput = "w-full px-4 py-3 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-pivot-900 dark:text-white placeholder-pivot-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all text-sm"

export default function SignUpForm({ role, sport, setSport }) {
  const [school, setSchool] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')
  const [showSchoolPicker, setShowSchoolPicker] = useState(false)
  const [schoolResults, setSchoolResults] = useState([])
  const [schoolLoading, setSchoolLoading] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [showPositionPicker, setShowPositionPicker] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [coachRole, setCoachRole] = useState('')
  const [showCoachRolePicker, setShowCoachRolePicker] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [emailAvailable, setEmailAvailable] = useState(true)
  const [emailChecking, setEmailChecking] = useState(false)
  // Server-sourced options (loaded from /api/auth/options in real mode)
  const [serverCoachRoles, setServerCoachRoles] = useState([])
  const [serverPositions, setServerPositions] = useState([])
  const [serverSports, setServerSports] = useState(null)

  const schoolRef = useRef(null)
  const positionRef = useRef(null)
  const coachRoleRef = useRef(null)
  const navigate = useNavigate()
  const { login, register, getPositionsForSport, getSchoolsForSport } = useUser()

  useEffect(() => {
    const handler = (e) => {
      if (schoolRef.current && !schoolRef.current.contains(e.target)) setShowSchoolPicker(false)
      if (positionRef.current && !positionRef.current.contains(e.target)) setShowPositionPicker(false)
      if (coachRoleRef.current && !coachRoleRef.current.contains(e.target)) setShowCoachRolePicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // School search via API (real mode) or local mock
  useEffect(() => {
    if (isMockMode()) return
    if (!schoolSearch || schoolSearch.trim().length < 2) {
      setSchoolResults([])
      return
    }
    setSchoolLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await apiSearchSchools(schoolSearch)
        // Map API format {id, name, fullName} → {name, region}
        setSchoolResults(data.map(s => ({
          name: s.fullName || s.name,
          shortName: s.name,
          id: s.id
        })))
      } catch {
        setSchoolResults([])
      } finally {
        setSchoolLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [schoolSearch])

  // Email format + availability check (real mode only)
  useEffect(() => {
    if (isMockMode()) return
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailValid(true)
      setEmailAvailable(true)
      return
    }
    const formatOk = EMAIL_RE.test(trimmed)
    setEmailValid(formatOk)
    if (!formatOk) {
      setEmailAvailable(true)
      setEmailChecking(false)
      return
    }
    setEmailChecking(true)
    const timer = setTimeout(async () => {
      try {
        const data = await apiCheckEmail(trimmed)
        setEmailAvailable(!!data.available)
      } catch {
        setEmailAvailable(true)
      } finally {
        setEmailChecking(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [email])

  // Load server-side options (coach roles / positions / sports whitelist).
  // Real mode: fetch from /api/auth/options — no client-side fallback to avoid
  // trusting hardcoded values for security-sensitive filters.
  // Mock mode: keep using local mock data (local-only, never sent to server).
  useEffect(() => {
    if (isMockMode()) return
    let cancelled = false
    const fetchOptions = async () => {
      try {
        const data = await apiGetOptions({ role, sport })
        if (cancelled) return
        if (Array.isArray(data.coachRoles)) setServerCoachRoles(data.coachRoles)
        if (Array.isArray(data.sports)) setServerSports(data.sports)
        if (Array.isArray(data.positions)) setServerPositions(data.positions)
      } catch {
        // Leave previous values in place; UI gracefully shows empty picker
      }
    }
    fetchOptions()
    return () => { cancelled = true }
  }, [role, sport])

  const mockSchools = getSchoolsForSport(sport)
  const filteredMockSchools = schoolSearch
    ? mockSchools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
    : mockSchools

  const displaySchools = isMockMode() ? filteredMockSchools : schoolResults
  const positions = isMockMode() ? getPositionsForSport(sport) : serverPositions
  const coachRoles = isMockMode() ? COACH_ROLES : serverCoachRoles

  const isFormValid = useMemo(() => {
    const base = school && teamName && name && email && emailValid
    const emailOk = !isMockMode() ? emailValid && emailAvailable && !emailChecking : true
    const hasPassword = !isMockMode() ? password.length >= 6 && password === confirmPassword : true
    return role === 'athlete'
      ? base && position && height && weight && hasPassword && emailOk
      : base && coachRole && hasPassword && emailOk
  }, [role, school, teamName, name, email, emailValid, emailAvailable, emailChecking, position, height, weight, coachRole, password, confirmPassword])

  const handleSportChange = (newSport) => {
    setSport(newSport)
    setPosition('')
    setSchool('')
    setSchoolSearch('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isMockMode()) {
      if (!emailValid) {
        setError('Please enter a valid email address')
        return
      }
      if (!emailAvailable) {
        setError('This email is already registered')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    const userData = role === 'athlete'
      ? { role, sport, school, teamName, name, email, position, height: parseFloat(height), weight: parseFloat(weight), password }
      : { role, sport, school, teamName, name, email, coachRole, password }

    if (isMockMode()) {
      login(userData, remember)
      navigate(role === 'athlete' ? '/athlete/onboarding' : '/coach')
      return
    }

    setIsSubmitting(true)
    const result = await register(userData, remember)
    setIsSubmitting(false)

    if (result.success) {
      navigate(result.user?.role === 'athlete' ? '/athlete/onboarding' : '/coach')
    } else {
      setError(result.message || 'Registration failed')
    }
  }

  const isAthlete = role === 'athlete'
  const gradient = isAthlete ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #14b8a6, #0d9488)'

  const inputPrefix = role === 'athlete' ? 'athlete' : 'coach'

  return (
    <motion.form {...fadeUp} onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      <div>
        <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-2">Sport <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          <SportButton selected={sport === 'rowing'} onClick={() => handleSportChange('rowing')} icon={ShipWheel} label="Rowing" accent={isAthlete} />
          <SportButton selected={sport === 'basketball'} onClick={() => handleSportChange('basketball')} icon={Dumbbell} label="Basketball" accent={!isAthlete} />
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-pivot-400 dark:text-slate-500 uppercase tracking-wider"><GraduationCap size={14} /> Institution</div>
        <div ref={schoolRef} className="relative">
          <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">School / University <span className="text-red-400">*</span></label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
            <input type="text" name={`${inputPrefix}-school`} autoComplete="off" value={schoolSearch || school} onChange={(e) => { setSchoolSearch(e.target.value); setSchool(e.target.value); setShowSchoolPicker(true) }} onFocus={() => setShowSchoolPicker(true)} placeholder="Search your school..." className={`${glassInput} pl-10`} required />
          </div>
          {showSchoolPicker && (displaySchools.length > 0 || schoolLoading) && (
            <div className="absolute z-30 mt-1.5 w-full max-h-52 overflow-y-auto rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl shadow-black/5 py-1">
              {schoolLoading && (
                <div className="px-4 py-3 text-sm text-pivot-400 dark:text-slate-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Searching schools...
                </div>
              )}
              {!schoolLoading && displaySchools.map((s) => (
                <button key={s.id || s.name} type="button" onClick={() => { setSchool(s.name); setSchoolSearch(''); setShowSchoolPicker(false) }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pivot-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${school === s.name ? 'bg-blue-50 dark:bg-blue-900/20 text-accent-blue font-medium' : 'text-pivot-700 dark:text-slate-300'}`}>
                  <span>{s.name}</span>
                  {s.region && <span className="text-[10px] text-pivot-400 dark:text-slate-500 bg-pivot-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{s.region}</span>}
                </button>
              ))}
              {!schoolLoading && displaySchools.length === 0 && schoolSearch.trim().length >= 2 && (
                <div className="px-4 py-3 text-sm text-pivot-400 dark:text-slate-500">No schools found</div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Team Name <span className="text-red-400">*</span></label>
          <input type="text" name={`${inputPrefix}-team`} autoComplete="off" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder={sport === 'rowing' ? 'e.g. Varsity Heavyweight 8+' : 'e.g. Men\'s Varsity Basketball'} className={glassInput} required />
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-pivot-400 dark:text-slate-500 uppercase tracking-wider"><Users size={14} /> Personal Info</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input type="text" name={`${inputPrefix}-name`} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder={isAthlete ? 'Alex Chen' : 'Coach Taylor'} className={glassInput} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Email <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type="text" inputMode="email" name={`${inputPrefix}-email`} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isAthlete ? 'alex@team.edu' : 'coach@team.edu'} className={glassInput + (email && !isMockMode() ? (!emailValid ? ' border-red-400 focus:ring-red-400/40' : emailAvailable ? ' border-green-400 focus:ring-green-400/40' : ' border-red-400 focus:ring-red-400/40') : '')} required />
              {!isMockMode() && email && emailChecking && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-pivot-400 animate-spin" />
              )}
              {!isMockMode() && email && !emailChecking && !emailValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-red-400 font-medium">Invalid</span>
              )}
              {!isMockMode() && email && !emailChecking && emailValid && !emailAvailable && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-red-400 font-medium">Taken</span>
              )}
              {!isMockMode() && email && !emailChecking && emailValid && emailAvailable && (
                <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
              )}
            </div>
          </div>
        </div>
        {isAthlete ? (
          <Picker ref={positionRef} label="Position" value={position} placeholder={sport === 'rowing' ? 'Select seat position...' : 'Select position...'} open={showPositionPicker} toggle={() => setShowPositionPicker(!showPositionPicker)} options={positions} onSelect={setPosition} accent="blue" />
        ) : (
          <Picker ref={coachRoleRef} label="Role" value={coachRole} placeholder="Select your role..." open={showCoachRolePicker} toggle={() => setShowCoachRolePicker(!showCoachRolePicker)} options={coachRoles} onSelect={setCoachRole} accent="teal" />
        )}
      </div>

      {!isMockMode() && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-pivot-400 dark:text-slate-500 uppercase tracking-wider"><Lock size={14} /> Security</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Password <span className="text-red-400">*</span></label>
              <input type="password" name={`${inputPrefix}-password`} autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="Min 6 characters" minLength={6} className={glassInput} required={!isMockMode()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
              <input type="password" name={`${inputPrefix}-confirm-password`} autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError('') }} placeholder="Repeat password" className={glassInput} required={!isMockMode()} />
            </div>
          </div>
        </div>
      )}

      {isAthlete && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-pivot-400 dark:text-slate-500 uppercase tracking-wider"><Ruler size={14} /> Physical Profile</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Height (cm) <span className="text-red-400">*</span></label>
              <input type="number" name={`${inputPrefix}-height`} autoComplete="off" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 188" min="100" max="250" className={glassInput} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Weight (kg) <span className="text-red-400">*</span></label>
              <div className="relative">
                <Weight size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
                <input type="number" name={`${inputPrefix}-weight`} autoComplete="off" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 82" min="30" max="200" className={`${glassInput} pl-10`} required />
              </div>
            </div>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${remember ? 'bg-accent-blue border-accent-blue' : 'border-pivot-300 dark:border-slate-600 group-hover:border-accent-blue/40'}`}>
          {remember && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
        <span className="text-sm text-pivot-600 dark:text-slate-400">Remember me</span>
      </label>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button type="submit" disabled={!isFormValid || isSubmitting} className={`w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${isFormValid ? '' : 'bg-pivot-300 dark:bg-slate-600'}`} style={isFormValid ? { background: gradient } : undefined}>
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-xs text-pivot-400 dark:text-slate-500">
        {isMockMode()
          ? 'Demo mode — your profile will be saved on this device.'
          : 'Real mode — account will be stored in the backend database.'}
      </p>
    </motion.form>
  )
}

function SportButton({ selected, onClick, icon: Icon, label, accent }) {
  return (
    <button type="button" onClick={onClick} className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 ${selected ? (accent ? 'border-accent-blue bg-blue-50/50 dark:bg-blue-900/20' : 'border-accent-teal bg-teal-50/50 dark:bg-teal-900/20') : 'border-pivot-200 dark:border-slate-600 hover:border-pivot-300'}`}>
      <Icon size={18} className={selected ? (accent ? 'text-accent-blue' : 'text-accent-teal') : 'text-pivot-400'} />
      <span className={`block text-xs font-semibold mt-1.5 ${selected ? (accent ? 'text-accent-blue' : 'text-accent-teal') : 'text-pivot-500'}`}>{label}</span>
    </button>
  )
}

const Picker = ({ ref, label, value, placeholder, open, toggle, options, onSelect, accent }) => (
  <div ref={ref} className="relative">
    <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">{label} <span className="text-red-400">*</span></label>
    <button type="button" onClick={toggle} className={`${glassInput} flex items-center justify-between text-left`}>
      <span className={value ? 'text-pivot-900 dark:text-white' : 'text-pivot-400 dark:text-slate-500'}>{value || placeholder}</span>
      <ChevronDown size={15} className={`text-pivot-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && (
      <div className="absolute z-30 mt-1.5 w-full max-h-52 overflow-y-auto rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl shadow-black/5 py-1">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => { onSelect(opt); toggle() }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pivot-50 dark:hover:bg-slate-700 transition-colors ${value === opt ? (accent === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-accent-blue font-medium' : 'bg-teal-50 dark:bg-teal-900/20 text-accent-teal font-medium') : 'text-pivot-700 dark:text-slate-300'}`}>
            {opt}
          </button>
        ))}
      </div>
    )}
  </div>
)
