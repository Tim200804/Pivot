import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, ShipWheel, Users, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import BrandPanel from './BrandPanel'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export default function LoginPage() {
  const [stage, setStage] = useState('role')
  const [role, setRole] = useState(null)
  const [sport, setSport] = useState('rowing')

  const { theme, cycleTheme } = useTheme()
  const { savedProfiles } = useUser()

  const savedForRole = useMemo(
    () => savedProfiles.filter(p => p.role === role && p.sport === sport),
    [savedProfiles, role, sport]
  )

  const handlePickRole = (r) => {
    setRole(r)
    const hasSaved = savedProfiles.some(p => p.role === r)
    setStage(hasSaved ? 'signin' : 'signup')
  }

  const handleBackToRole = () => {
    setStage('role')
    setRole(null)
  }

  const AccentIcon = role === 'athlete' ? ShipWheel : Users

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md space-y-6 my-8"
        >
          <div className="flex justify-end">
            <button
              onClick={cycleTheme}
              className="p-2.5 rounded-xl hover:bg-pivot-100/60 dark:hover:bg-slate-700/40 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun size={18} className="text-slate-400" />
                : <Moon size={18} className="text-pivot-500" />
              }
            </button>
          </div>

          <AnimatePresence mode="wait">
            {stage === 'role' ? (
              <motion.div key="role" {...fadeUp} className="space-y-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/5 dark:bg-accent-blue/10 text-accent-blue text-xs font-medium mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                    Welcome to Pivot
                  </div>
                  <h2 className="text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                    Who are you?
                  </h2>
                  <p className="text-pivot-500 dark:text-slate-400 text-sm">
                    Select your role to continue
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <RoleCard
                    role="athlete"
                    icon={ShipWheel}
                    title="Athlete"
                    description="Track your state, see your patterns, take control"
                    onClick={() => handlePickRole('athlete')}
                  />
                  <RoleCard
                    role="coach"
                    icon={Users}
                    title="Coach"
                    description="Monitor your team, spot signals early, intervene with confidence"
                    onClick={() => handlePickRole('coach')}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="auth" {...fadeUp} className="space-y-6">
                <button
                  type="button"
                  onClick={handleBackToRole}
                  className="text-sm text-pivot-500 dark:text-slate-400 hover:text-pivot-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  Change role
                </button>

                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${role === 'athlete' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-teal-50 dark:bg-teal-900/20'} flex items-center justify-center`}>
                    <AccentIcon size={18} className={role === 'athlete' ? 'text-accent-blue' : 'text-accent-teal'} />
                  </div>
                  <div>
                    <p className="font-semibold text-pivot-900 dark:text-white text-sm capitalize">{role}</p>
                    <p className="text-xs text-pivot-400 dark:text-slate-500">
                      {stage === 'signin' ? 'Welcome back' : 'Get started'}
                    </p>
                  </div>
                </div>

                <div className="flex p-1 rounded-2xl bg-pivot-100/60 dark:bg-slate-700/40">
                  <AuthTab active={stage === 'signin'} onClick={() => setStage('signin')} icon={LogIn} label="Sign In" />
                  <AuthTab active={stage === 'signup'} onClick={() => setStage('signup')} icon={UserPlus} label="Create Account" />
                </div>

                <AnimatePresence mode="wait">
                  {stage === 'signin' ? (
                    <SignInForm key="signin" role={role} sport={sport} savedForRole={savedForRole} />
                  ) : (
                    <SignUpForm key="signup" role={role} sport={sport} setSport={setSport} />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function RoleCard({ role, icon: Icon, title, description, onClick }) {
  const isAthlete = role === 'athlete'
  return (
    <button
      onClick={onClick}
      className={isAthlete
        ? 'group p-6 rounded-3xl border-2 border-pivot-200 dark:border-slate-700 hover:border-accent-blue dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 text-left'
        : 'group p-6 rounded-3xl border-2 border-pivot-200 dark:border-slate-700 hover:border-accent-teal dark:hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all duration-300 text-left'
      }
    >
      <div className={isAthlete
        ? 'w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'
        : 'w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'
      }>
        <Icon size={22} className={isAthlete ? 'text-accent-blue' : 'text-accent-teal'} />
      </div>
      <h3 className="font-bold text-pivot-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-pivot-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </button>
  )
}

function AuthTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-white dark:bg-slate-800 text-pivot-900 dark:text-white shadow-sm'
          : 'text-pivot-500 dark:text-slate-400 hover:text-pivot-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
