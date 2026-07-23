import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Watch, Heart, Activity, Moon, ArrowRight, CheckCircle2, Smartphone, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export default function AthleteOnboarding({ onComplete }) {
  const { user } = useUser()
  const [step, setStep] = useState('connect') // 'connect' | 'permissions' | 'checkin' | 'complete'
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
  const navigate = useNavigate()

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
          {['connect', 'permissions', 'checkin', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                ['connect', 'permissions', 'checkin', 'complete'].indexOf(step) >= i
                  ? 'bg-accent-blue text-white'
                  : 'bg-pivot-100 dark:bg-slate-700 text-pivot-400'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`w-8 h-0.5 mx-1 transition-colors ${
                ['connect', 'permissions', 'checkin', 'complete'].indexOf(step) > i
                  ? 'bg-accent-blue'
                  : 'bg-pivot-100 dark:bg-slate-700'
              }`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'connect' && (
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

          {step === 'permissions' && (
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
                Pivot now has a baseline. Your dashboard will update as new data comes in from your watch and daily check-ins.
              </p>

              <div className="bg-pivot-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs text-pivot-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Apple Watch connected (demo)
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
      </div>
    </div>
  )
}
