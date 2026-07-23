import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { ATHLETES } from '../data/mockData'

// Psychology-informed color palettes based on athlete mood
const moodPalettes = {
  high: {
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    accentDark: '#1d4ed8',
    accentBorder: '#93c5fd',
    bgAccent: '#eff6ff',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    label: 'Flow State',
    description: 'Calm focus & confidence',
  },
  neutral: {
    accent: '#059669',
    accentLight: '#d1fae5',
    accentDark: '#047857',
    accentBorder: '#6ee7b7',
    bgAccent: '#ecfdf5',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    label: 'Steady',
    description: 'Grounded & stable',
  },
  low: {
    accent: '#d97706',
    accentLight: '#fef3c7',
    accentDark: '#b45309',
    accentBorder: '#fcd34d',
    bgAccent: '#fffbeb',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    label: 'Recovery Mode',
    description: 'Warmth & comfort',
  },
  critical: {
    accent: '#b45309',
    accentLight: '#fef3c7',
    accentDark: '#92400e',
    accentBorder: '#f59e0b',
    bgAccent: '#fefce8',
    gradient: 'linear-gradient(135deg, #b45309, #dc2626)',
    label: 'Need Support',
    description: 'Gentle care & connection',
  },
}

function deriveMoodPalette(athleteId) {
  const athlete = ATHLETES.find(a => a.id === athleteId) || ATHLETES[2]
  const latestCheckin = athlete.checkins[athlete.checkins.length - 1]
  const mood = latestCheckin.mood

  if (mood >= 4) return moodPalettes.high
  if (mood === 3) return moodPalettes.neutral
  if (mood === 2) return moodPalettes.low
  return moodPalettes.critical
}

const MoodColorContext = createContext()

export function MoodColorProvider({ children }) {
  const [moodAthleteId, setMoodAthleteId] = useState(ATHLETES[2].id) // default: Morgan

  const palette = useMemo(() => deriveMoodPalette(moodAthleteId), [moodAthleteId])

  const setMoodAthlete = useCallback((id) => {
    setMoodAthleteId(id)
  }, [])

  return (
    <MoodColorContext.Provider value={{ palette, moodPalettes, setMoodAthlete, moodAthleteId }}>
      {children}
    </MoodColorContext.Provider>
  )
}

export function useMoodColors() {
  const ctx = useContext(MoodColorContext)
  if (!ctx) throw new Error('useMoodColors must be used within MoodColorProvider')
  return ctx
}
