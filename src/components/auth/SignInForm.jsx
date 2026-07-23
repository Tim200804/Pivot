import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, CheckCircle2 } from 'lucide-react'
import { useUser } from '../../context/UserContext'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const glassInput = "w-full px-4 py-3 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-pivot-900 dark:text-white placeholder-pivot-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all text-sm"

export default function SignInForm({ role, sport, savedForRole }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { login, findSavedProfile } = useUser()

  const handleQuickLogin = (profile) => {
    login(profile, true)
    navigate(profile.role === 'athlete' ? '/athlete/onboarding' : '/coach')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    const saved = findSavedProfile(email.trim())
    if (saved) {
      login(saved, remember)
    } else {
      const displayName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const demoUser = {
        role,
        sport,
        school: 'University of Pennsylvania',
        teamName: sport === 'rowing' ? 'Varsity Heavyweight 8+' : 'Men\'s Varsity Basketball',
        name: displayName,
        email: email.trim(),
        position: role === 'athlete' ? (sport === 'rowing' ? 'Stroke Seat' : 'Point Guard (PG)') : undefined,
        height: role === 'athlete' ? 188 : undefined,
        weight: role === 'athlete' ? 82 : undefined,
        coachRole: role === 'coach' ? 'Head Coach' : undefined,
      }
      login(demoUser, remember)
    }

    navigate(role === 'athlete' ? '/athlete/onboarding' : '/coach')
  }

  const gradient = role === 'athlete'
    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
    : 'linear-gradient(135deg, #14b8a6, #0d9488)'

  return (
    <motion.form key="signin" {...fadeUp} onSubmit={handleSubmit} className="space-y-5">
      {savedForRole.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-pivot-400 dark:text-slate-500 uppercase tracking-wider">
            Previously saved
          </p>
          <div className="space-y-2">
            {savedForRole.map((profile) => (
              <button
                key={profile.email}
                type="button"
                onClick={() => handleQuickLogin(profile)}
                className="w-full p-3 rounded-2xl border border-pivot-200 dark:border-slate-600 hover:border-accent-blue dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${profile.role === 'athlete' ? 'bg-blue-100 dark:bg-blue-900/30 text-accent-blue' : 'bg-teal-100 dark:bg-teal-900/30 text-accent-teal'} flex items-center justify-center text-xs font-bold`}>
                      {profile.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-pivot-900 dark:text-white">{profile.name}</p>
                      <p className="text-xs text-pivot-400 dark:text-slate-500">
                        {profile.school} · {profile.role === 'athlete' ? profile.position : profile.coachRole}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-pivot-300 group-hover:text-accent-blue transition-colors" />
                </div>
              </button>
            ))}
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pivot-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-surface-light dark:bg-surface-dark text-xs text-pivot-400 dark:text-slate-500">
                or sign in with email
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Email</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="you@university.edu"
            className={`${glassInput} pl-10`}
            required
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={`${glassInput} pl-10`}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          remember ? 'bg-accent-blue border-accent-blue' : 'border-pivot-300 dark:border-slate-600 group-hover:border-accent-blue/40'
        }`}>
          {remember && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="sr-only"
        />
        <span className="text-sm text-pivot-600 dark:text-slate-400">Remember me</span>
      </label>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: gradient }}
      >
        Sign In
        <ArrowRight size={16} />
      </button>

      <p className="text-center text-xs text-pivot-400 dark:text-slate-500">
        Demo mode — any password works. Saved accounts are stored on this device.
      </p>
    </motion.form>
  )
}
