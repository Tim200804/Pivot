import { motion } from 'framer-motion'

/**
 * Pivot Brand Logo — Pure SVG Recreation
 * Based on the user's design: blue gradient athlete silhouette + ECG line + Pivot text
 * Supports light and dark modes via the `variant` prop
 * Supports animated draw-in via the `animated` prop
 */
export default function PivotLogo({
  size = 120,
  variant = 'dark', // 'dark' = white elements on dark bg (splash), 'light' = colored on light bg
  animated = false,
  className = '',
}) {
  const isDark = variant === 'dark'
  const primary = isDark ? '#60a5fa' : '#2563eb'   // blue-400 vs blue-600
  const secondary = isDark ? '#818cf8' : '#3b82f6' // indigo-400 vs blue-500
  const accent = isDark ? '#22d3ee' : '#0ea5e9'    // cyan-400 vs sky-500
  const textColor = isDark ? '#ffffff' : '#0f172a'  // white vs slate-900
  const subtitleColor = isDark ? '#94a3b8' : '#64748b'

  const drawPath = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.15, duration: 0.8, ease: 'easeInOut' },
        opacity: { delay: i * 0.15, duration: 0.4 },
      },
    }),
  }

  const scaleIn = {
    hidden: { scale: 0.7, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.6 + i * 0.05, duration: 0.4, ease: 'easeOut' },
    }),
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Athlete gradient */}
          <linearGradient id={`athlete-grad-${variant}`} x1="60" y1="30" x2="140" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primary} />
            <stop offset="50%" stopColor={secondary} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
          {/* Text gradient */}
          <linearGradient id={`text-grad-${variant}`} x1="20" y1="155" x2="180" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primary} />
            <stop offset="50%" stopColor={secondary} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
          {/* Glow filter for dark mode */}
          {isDark && (
            <filter id={`glow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Athlete Silhouette */}
        <motion.g
          initial={animated ? 'hidden' : 'visible'}
          animate="visible"
          variants={scaleIn}
        >
          <motion.path
            d="M85 30 
               C95 28, 105 28, 110 35
               C112 38, 112 42, 110 45
               C108 48, 104 50, 100 50
               C105 52, 115 50, 120 55
               C125 60, 130 65, 135 70
               C140 75, 145 80, 148 85
               C152 90, 155 95, 155 100
               C155 105, 150 108, 145 108
               C140 108, 135 105, 132 100
               C128 95, 125 90, 122 85
               C120 82, 118 85, 115 90
               C112 95, 110 100, 108 105
               C105 110, 102 115, 100 120
               C97 125, 95 130, 93 135
               C90 140, 85 145, 80 148
               C75 150, 70 148, 68 145
               C66 142, 68 138, 70 135
               C72 132, 75 128, 78 125
               C80 122, 82 118, 85 115
               C88 110, 90 105, 88 100
               C86 95, 82 90, 80 85
               C78 80, 75 75, 72 70
               C70 65, 68 60, 65 55
               C62 50, 60 45, 62 40
               C65 35, 75 32, 85 30Z"
            fill={`url(#athlete-grad-${variant})`}
            filter={isDark ? `url(#glow-${variant})` : undefined}
            opacity={0.95}
          />
        </motion.g>

        {/* ECG / Heartbeat line across athlete body */}
        <motion.g
          initial={animated ? 'hidden' : 'visible'}
          animate="visible"
        >
          <motion.path
            d="M 70 80 
               L 82 80 
               L 86 68 
               L 92 92 
               L 98 76 
               L 102 88 
               L 108 80 
               L 120 80"
            stroke={isDark ? '#22d3ee' : '#0ea5e9'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            variants={animated ? drawPath : undefined}
            custom={0}
            filter={isDark ? `url(#glow-${variant})` : undefined}
          />
        </motion.g>

        {/* PIVOT text — letter by letter */}
        <motion.g
          initial={animated ? 'hidden' : 'visible'}
          animate="visible"
        >
          {'Pivot'.split('').map((char, i) => (
            <motion.text
              key={i}
              x={24 + i * 30}
              y={190}
              fontSize="42"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              fill={isDark ? textColor : `url(#text-grad-${variant})`}
              variants={animated ? fadeUp : undefined}
              custom={i}
              style={{ letterSpacing: '-0.02em' }}
            >
              {char}
            </motion.text>
          ))}
        </motion.g>

        {/* Subtitle */}
        <motion.text
          x="100"
          y="220"
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={subtitleColor}
          letterSpacing="0.15em"
          initial={animated ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          ATHLETE HEALTH & REAL-TIME COACHING
        </motion.text>
      </svg>
    </div>
  )
}

/**
 * Compact logo icon — just the athlete silhouette without text (for sidebar, favicon, header)
 */
export function PivotIcon({ size = 32, variant = 'dark', className = '' }) {
  const isDark = variant === 'dark'
  const primary = isDark ? '#60a5fa' : '#2563eb'
  const secondary = isDark ? '#818cf8' : '#3b82f6'
  const accent = isDark ? '#22d3ee' : '#0ea5e9'

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`icon-grad-${variant}`} x1="10" y1="5" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primary} />
            <stop offset="50%" stopColor={secondary} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
        <path
          d="M25 5 
             C28 4.5, 32 4.5, 34 7
             C35 8.5, 35 10, 34 11
             C33 12, 31 13, 30 13
             C32 14, 36 13, 38 15
             C40 17, 42 19, 44 21
             C46 23, 48 25, 49 27
             C50 29, 51 31, 51 33
             C51 35, 49 36, 47 36
             C45 36, 43 35, 42 33
             C40 31, 39 29, 38 27
             C37 26, 36 27, 35 29
             C34 31, 33 33, 32 35
             C31 37, 30 39, 30 41
             C29 43, 28 45, 27 46
             C25 48, 22 50, 20 51
             C18 52, 15 51, 14 49
             C13 47, 14 45, 15 43
             C16 41, 17 39, 19 37
             C20 35, 21 33, 22 31
             C23 29, 24 27, 23 25
             C22 23, 20 21, 19 19
             C18 17, 17 15, 16 13
             C15 11, 14 9, 15 7
             C16 5, 20 4.5, 25 5Z"
          fill={`url(#icon-grad-${variant})`}
          opacity={0.95}
        />
        <path
          d="M 15 20 
             L 22 20 
             L 24 15 
             L 27 25 
             L 30 18 
             L 32 23 
             L 35 20 
             L 42 20"
          stroke={isDark ? '#22d3ee' : '#0ea5e9'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
