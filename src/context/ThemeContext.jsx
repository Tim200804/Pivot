import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext()

function getTimeBasedTheme() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  // 'auto' — time-based
  return getTimeBasedTheme()
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pivot-theme')
      if (saved) return saved
    }
    return 'auto' // Default: auto time-based
  })

  const resolvedTheme = resolveTheme(themeMode)

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    if (themeMode === 'auto') {
      localStorage.removeItem('pivot-theme')
    } else {
      localStorage.setItem('pivot-theme', themeMode)
    }
  }, [resolvedTheme, themeMode])

  // Refresh auto mode every minute
  useEffect(() => {
    if (themeMode !== 'auto') return
    const interval = setInterval(() => {
      // Force re-render to check time
      setThemeMode('auto')
    }, 60000)
    return () => clearInterval(interval)
  }, [themeMode])

  const setTheme = useCallback((mode) => {
    setThemeMode(mode)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'auto'
      return 'light'
    })
  }, [])

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme,
      themeMode,
      setTheme,
      cycleTheme,
      isAuto: themeMode === 'auto',
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
