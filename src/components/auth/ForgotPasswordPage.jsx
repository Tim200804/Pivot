import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Send,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { apiForgotPassword, apiVerifyResetCode, apiResetPassword } from '../../config/api'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const glassInput = "w-full px-4 py-3 rounded-2xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-pivot-900 dark:text-white placeholder-pivot-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all text-sm"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email') // email | code | password | success
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate()
  const { theme, cycleTheme } = useTheme()
  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiForgotPassword(email.trim())
      if (result.success) {
        setStep('code')
        setCountdown(60)
        // Auto-focus first code input
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setError(result.message || 'Failed to send code')
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits filled
    const filled = newCode.filter((c) => c !== '').length
    if (filled === 6) {
      const fullCode = newCode.join('')
      handleVerifyCode(fullCode)
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)
    setError('')

    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()

    if (pasted.length === 6) {
      handleVerifyCode(pasted)
    }
  }

  const handleVerifyCode = async (fullCode) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')

    try {
      const result = await apiVerifyResetCode(email.trim(), fullCode)
      if (result.success) {
        setStep('password')
      } else {
        setError(result.message || 'Invalid code')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError(err.message || 'Verification failed')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword) {
      setError('Please enter a new password')
      return
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must be at least 8 characters with letters and digits')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const fullCode = code.join('')
      const result = await apiResetPassword(email.trim(), fullCode, newPassword)
      if (result.success) {
        setStep('success')
      } else {
        setError(result.message || 'Failed to reset password')
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    setCode(['', '', '', '', '', ''])
    await handleSendCode({ preventDefault: () => {} })
  }

  const gradient = 'linear-gradient(135deg, #3b82f6, #2563eb)'

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pivot-900 via-pivot-800 to-pivot-900" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(20,184,166,0.2) 0%, transparent 50%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pivot</h1>
            <p className="text-sm text-white/60 mt-1">Athlete Resilience Platform</p>
          </div>
          <div className="space-y-4">
            <p className="text-lg font-medium leading-relaxed text-white/90">
              "Resilience is not about never falling. It's about rising every time you fall."
            </p>
            <p className="text-sm text-white/50">— Pivot Team</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
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

          <button
            onClick={() => navigate('/login')}
            className="text-sm text-pivot-500 dark:text-slate-400 hover:text-pivot-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </button>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div key="email" {...fadeUp} className="space-y-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/5 dark:bg-accent-blue/10 text-accent-blue text-xs font-medium mb-1">
                    <KeyRound size={12} />
                    Password Reset
                  </div>
                  <h2 className="text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                    Forgot your password?
                  </h2>
                  <p className="text-pivot-500 dark:text-slate-400 text-sm">
                    Enter your email and we'll send you a 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-5">
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

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: gradient }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isSubmitting ? 'Sending...' : 'Send Code'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'code' && (
              <motion.div key="code" {...fadeUp} className="space-y-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/5 dark:bg-accent-blue/10 text-accent-blue text-xs font-medium mb-1">
                    <Mail size={12} />
                    Check your inbox
                  </div>
                  <h2 className="text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                    Enter verification code
                  </h2>
                  <p className="text-pivot-500 dark:text-slate-400 text-sm">
                    We've sent a 6-digit code to <span className="font-medium text-pivot-700 dark:text-slate-300">{email}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-2xl border-2 border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-pivot-900 dark:text-white focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 transition-all"
                        disabled={isSubmitting}
                      />
                    ))}
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

                  {isSubmitting && (
                    <div className="flex items-center justify-center gap-2 text-pivot-500 dark:text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0}
                      className="text-sm text-accent-blue hover:text-blue-600 disabled:text-pivot-400 dark:disabled:text-slate-500 transition-colors"
                    >
                      {countdown > 0
                        ? `Resend code in ${countdown}s`
                        : "Didn't receive it? Resend"
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div key="password" {...fadeUp} className="space-y-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/5 dark:bg-accent-blue/10 text-accent-blue text-xs font-medium mb-1">
                    <ShieldCheck size={12} />
                    Verified
                  </div>
                  <h2 className="text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                    Set new password
                  </h2>
                  <p className="text-pivot-500 dark:text-slate-400 text-sm">
                    Create a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                        placeholder="Min 8 chars, letters + digits"
                        className={`${glassInput} pl-10 pr-10`}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pivot-400 hover:text-pivot-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pivot-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pivot-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                        placeholder="Re-enter your password"
                        className={`${glassInput} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: gradient }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    {isSubmitting ? 'Updating...' : 'Reset Password'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" {...fadeUp} className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">
                    Password reset!
                  </h2>
                  <p className="text-pivot-500 dark:text-slate-400 text-sm">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: gradient }}
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
