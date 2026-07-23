import { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider, useUser } from './context/UserContext'
import { AlertProvider } from './context/AlertContext'
import { MoodColorProvider } from './context/MoodColorContext'
import SplashScreen from './components/auth/SplashScreen'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Eager load only the login page for fast first paint
import LoginPage from './components/auth/LoginPage'

// Lazy load all other routes to reduce initial bundle
const AthleteOnboarding = lazy(() => import('./components/auth/AthleteOnboarding'))
const AthleteDashboard = lazy(() => import('./components/athlete/AthleteDashboard'))
const AthleteAlertCenter = lazy(() => import('./components/athlete/AthleteAlertCenter'))
const AthleteCheckinHistory = lazy(() => import('./components/athlete/AthleteCheckinHistory'))
const AthleteTrends = lazy(() => import('./components/athlete/AthleteTrends'))
const CoachDashboard = lazy(() => import('./components/coach/CoachDashboard'))
const CoachAlertCenter = lazy(() => import('./components/coach/CoachAlertCenter'))
const CoachRoster = lazy(() => import('./components/coach/CoachRoster'))
const SettingsPage = lazy(() => import('./components/ui/SettingsPage'))

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

function PageLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <div className="w-8 h-8 border-2 border-pivot-200 dark:border-slate-600 border-t-accent-blue rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ allowedRole }) {
  const { user } = useUser()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const fallback = user.role === 'athlete' ? '/athlete' : '/coach'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-[100dvh]"
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Athlete routes */}
              <Route element={<ProtectedRoute allowedRole="athlete" />}>
                <Route path="/athlete" element={<AthleteDashboard />} />
                <Route path="/athlete/onboarding" element={<AthleteOnboarding />} />
                <Route path="/athlete/alerts" element={<AthleteAlertCenter />} />
                <Route path="/athlete/checkin" element={<AthleteCheckinHistory />} />
                <Route path="/athlete/trends" element={<AthleteTrends />} />
                <Route path="/athlete/settings" element={<SettingsPage role="athlete" />} />
              </Route>

              {/* Coach routes */}
              <Route element={<ProtectedRoute allowedRole="coach" />}>
                <Route path="/coach" element={<CoachDashboard />} />
                <Route path="/coach/alerts" element={<CoachAlertCenter />} />
                <Route path="/coach/roster" element={<CoachRoster />} />
                <Route path="/coach/settings" element={<SettingsPage role="coach" />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  )
}

function AppWithSplash() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Safety net: if splash doesn't self-dismiss within 10s, force hide
    const safetyTimer = setTimeout(() => {
      setShowSplash(false)
    }, 10000)
    return () => clearTimeout(safetyTimer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash-wrapper"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[100]"
          >
            <SplashScreen onComplete={() => setShowSplash(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatedRoutes />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AlertProvider>
          <MoodColorProvider>
            <AppWithSplash />
          </MoodColorProvider>
        </AlertProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
