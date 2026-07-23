import { motion } from 'framer-motion'
import { Activity, Heart, Shield, ShipWheel, Dumbbell } from 'lucide-react'

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-pivot-800 via-pivot-900 to-slate-950">
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(59,130,246,0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(20,184,166,0.2) 0%, transparent 50%),
              repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-14 h-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <img
            src="/pivot-logo.png"
            alt="Pivot Logo"
            className="w-48 h-auto object-contain drop-shadow-[0_0_16px_rgba(59,130,246,0.3)] mb-2"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
            See what<br />
            <span className="text-blue-400">numbers can't show.</span>
          </h1>
          <p className="text-blue-200/70 text-base leading-relaxed max-w-sm">
            The first signal of struggle isn't always visible.
            Pivot captures what athletes feel before they say it —
            giving coaches a data-driven sixth sense.
          </p>

          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 text-blue-300/60 text-sm">
              <Activity size={14} />
              <span>Real-time biometrics</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300/60 text-sm">
              <Heart size={14} />
              <span>Early warning system</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300/60 text-sm">
              <Shield size={14} />
              <span>Privacy-first</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-blue-300/40 text-xs">Designed for</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-blue-300/60 text-xs">
                <ShipWheel size={12} /> Rowing
              </span>
              <span className="flex items-center gap-1.5 text-blue-300/60 text-xs">
                <Dumbbell size={12} /> Basketball
              </span>
            </div>
          </div>
          <p className="text-blue-300/30 text-xs">
            Built for athletes. Backed by data. Powered by empathy.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
