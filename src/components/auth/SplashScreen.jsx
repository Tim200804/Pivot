import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tagline = 'Athlete Health & Real-Time Coaching'.split('')

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter') // 'enter' | 'exit'
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowTagline(true), 400)
    const t2 = setTimeout(() => setPhase('exit'), 3300)
    const t3 = setTimeout(() => { if (onComplete) onComplete() }, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="splash"
          className="fixed inset-0 flex flex-col items-center justify-center bg-[#080c2a]"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
        >
          {/* Subtle ambient glow behind logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(6,182,212,0.12) 45%, transparent 70%)',
            }}
          />

          {/* Logo: fades in and gently rises */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <img
              src="/pivot-logo.png"
              alt="Pivot Logo"
              className="w-56 h-auto object-contain drop-shadow-[0_0_24px_rgba(59,130,246,0.25)]"
            />
          </motion.div>

          {/* Tagline: each character fades in staggered */}
          <motion.div
            className="relative z-10 mt-10 flex items-center justify-center flex-wrap gap-0.5"
            initial={{ opacity: 0 }}
          >
            {showTagline && (
              <>
                {tagline.map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.03,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`text-[15px] font-semibold tracking-wider ${
                      char === ' ' ? 'w-1' : ''
                    }`}
                    style={{
                      color: 'rgba(226, 232, 240, 0.9)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </>
            )}
          </motion.div>

          {/* Progress bar — thin, elegant */}
          <motion.div
            className="absolute bottom-14 w-32 h-[1.5px] bg-slate-700/40 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3.3, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.6), rgba(14,165,233,0.4))' }}
            />
          </motion.div>

          {/* Minimal loading text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 text-[10px] text-slate-500 tracking-[0.3em] uppercase"
          >
            Loading
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
