// Mock data for Pivot Platform — 7 days of athlete health data
// Demonstrates alert system with yellow/red/black triggers

const DAYS = ['Mon 7/10', 'Tue 7/11', 'Wed 7/12', 'Thu 7/13', 'Fri 7/14', 'Sat 7/15', 'Sun 7/16']

function generateDailyData(baseHRV, baseRHR, baseSleep, variance = 1) {
  return DAYS.map((day, i) => {
    const jitter = (Math.random() - 0.5) * variance
    return {
      day,
      hrv: Math.round((baseHRV + jitter * 10 + Math.sin(i * 1.2) * 4) * 10) / 10,
      rhr: Math.round(baseRHR + jitter * 3 + Math.cos(i * 0.8) * 2),
      sleepHours: Math.round((baseSleep + jitter * 0.5 + Math.sin(i * 0.9) * 0.4) * 10) / 10,
      sleepDeep: Math.round((20 + jitter * 3 + Math.cos(i) * 4) * 10) / 10,
      sleepREM: Math.round((25 + jitter * 2 + Math.sin(i * 0.7) * 3) * 10) / 10,
      spo2: Math.round((97 + jitter * 0.5) * 10) / 10,
      respiratoryRate: Math.round((14 + jitter * 1.5) * 10) / 10,
      skinTemp: Math.round((36.5 + jitter * 0.3) * 10) / 10,
    }
  })
}

function generateTrainingData(baseSplit) {
  return DAYS.map((day, i) => {
    const jitter = (Math.random() - 0.5)
    return {
      day,
      distance: Math.round(8000 + jitter * 2000 + (i % 2 === 0 ? 4000 : 0)),
      avgSplit: baseSplit + jitter * 5 + (i > 4 ? 3 : 0),
      avgSPM: Math.round(28 + jitter * 4),
      maxHR: Math.round(175 + jitter * 15),
      avgHR: Math.round(145 + jitter * 10),
      duration: Math.round(45 + jitter * 15),
    }
  })
}

function generateCheckins() {
  return DAYS.map((day, i) => {
    const trend = i > 4 ? -1 : 0
    return {
      day,
      mood: Math.max(1, Math.min(5, Math.round(4 + trend + (Math.random() - 0.5) * 1))),
      motivation: Math.max(1, Math.min(10, Math.round(7 + trend * 2 + (Math.random() - 0.5) * 2))),
      fatigue: Math.max(1, Math.min(10, Math.round(4 - trend * 2 + (Math.random() - 0.5) * 2))),
      challenge: i > 4 ? 'mental_fatigue' : i % 3 === 0 ? 'physical_fatigue' : 'none',
      journal: i > 4 ? 'Feeling drained, hard to get up this morning' : '',
    }
  })
}

// Athlete 1 — Healthy, good recovery (Alex Chen)
const alexHealth = generateDailyData(65, 52, 7.8, 1.2)
const alexTraining = generateTrainingData(112)
const alexCheckins = generateCheckins()

// Athlete 2 — Yellow alert: declining HRV, rising RHR (Jordan Lee)
const jordanHealth = [
  { day: 'Mon 7/10', hrv: 58, rhr: 54, sleepHours: 7.2, sleepDeep: 22, sleepREM: 26, spo2: 97.5, respiratoryRate: 14.2, skinTemp: 36.4 },
  { day: 'Tue 7/11', hrv: 55, rhr: 55, sleepHours: 6.8, sleepDeep: 19, sleepREM: 24, spo2: 97.2, respiratoryRate: 14.5, skinTemp: 36.5 },
  { day: 'Wed 7/12', hrv: 52, rhr: 56, sleepHours: 6.5, sleepDeep: 17, sleepREM: 23, spo2: 97.0, respiratoryRate: 14.8, skinTemp: 36.6 },
  { day: 'Thu 7/13', hrv: 49, rhr: 57, sleepHours: 6.2, sleepDeep: 16, sleepREM: 21, spo2: 96.8, respiratoryRate: 15.1, skinTemp: 36.7 },
  { day: 'Fri 7/14', hrv: 47, rhr: 58, sleepHours: 5.8, sleepDeep: 15, sleepREM: 20, spo2: 96.5, respiratoryRate: 15.3, skinTemp: 36.8 },
  { day: 'Sat 7/15', hrv: 44, rhr: 59, sleepHours: 5.5, sleepDeep: 14, sleepREM: 19, spo2: 96.3, respiratoryRate: 15.6, skinTemp: 36.9 },
  { day: 'Sun 7/16', hrv: 42, rhr: 60, sleepHours: 5.2, sleepDeep: 13, sleepREM: 18, spo2: 96.0, respiratoryRate: 16.0, skinTemp: 37.0 },
]
const jordanTraining = generateTrainingData(115)
const jordanCheckins = DAYS.map((day, i) => ({
  day,
  mood: Math.max(1, Math.min(5, Math.round(4 - i * 0.4))),
  motivation: Math.max(1, Math.min(10, Math.round(7 - i * 0.7))),
  fatigue: Math.max(1, Math.min(10, Math.round(4 + i * 0.6))),
  challenge: i > 2 ? 'mental_fatigue' : 'physical_fatigue',
  journal: i > 3 ? 'Everything feels heavy. Not sure I want to keep going.' : i > 1 ? 'Tired but pushing through' : 'Okay today',
}))

// Athlete 3 — Red alert: severe decline across all metrics (Morgan Smith)
const morganHealth = [
  { day: 'Mon 7/10', hrv: 55, rhr: 56, sleepHours: 6.8, sleepDeep: 18, sleepREM: 22, spo2: 97.0, respiratoryRate: 14.5, skinTemp: 36.5 },
  { day: 'Tue 7/11', hrv: 50, rhr: 58, sleepHours: 6.2, sleepDeep: 16, sleepREM: 20, spo2: 96.7, respiratoryRate: 15.0, skinTemp: 36.7 },
  { day: 'Wed 7/12', hrv: 44, rhr: 60, sleepHours: 5.5, sleepDeep: 14, sleepREM: 18, spo2: 96.3, respiratoryRate: 15.5, skinTemp: 36.9 },
  { day: 'Thu 7/13', hrv: 38, rhr: 63, sleepHours: 5.0, sleepDeep: 11, sleepREM: 15, spo2: 95.8, respiratoryRate: 16.2, skinTemp: 37.1 },
  { day: 'Fri 7/14', hrv: 35, rhr: 64, sleepHours: 4.5, sleepDeep: 10, sleepREM: 14, spo2: 95.5, respiratoryRate: 16.8, skinTemp: 37.3 },
  { day: 'Sat 7/15', hrv: 32, rhr: 66, sleepHours: 4.2, sleepDeep: 9, sleepREM: 13, spo2: 95.2, respiratoryRate: 17.2, skinTemp: 37.4 },
  { day: 'Sun 7/16', hrv: 30, rhr: 67, sleepHours: 4.0, sleepDeep: 8, sleepREM: 12, spo2: 95.0, respiratoryRate: 17.5, skinTemp: 37.5 },
]
const morganTraining = DAYS.map((day, i) => ({
  day,
  distance: Math.max(0, Math.round(8000 - i * 600)),
  avgSplit: 115 + i * 3,
  avgSPM: Math.round(28 - i * 0.5),
  maxHR: Math.round(170 + i * 3),
  avgHR: Math.round(148 + i * 2),
  duration: Math.round(45 - i * 3),
}))
const morganCheckins = DAYS.map((day, i) => ({
  day,
  mood: Math.max(1, Math.min(5, Math.round(3 - i * 0.5))),
  motivation: Math.max(1, Math.min(10, Math.round(5 - i))),
  fatigue: Math.max(1, Math.min(10, Math.round(5 + i * 0.7))),
  challenge: i > 1 ? 'mental_fatigue' : 'physical_fatigue',
  journal: i > 3 ? 'Can\'t do this anymore. Body won\'t cooperate. Mind is blank.' : 'Struggling to keep pace, everything hurts',
}))

// Athlete 4 — Black alert (urgent): severe decline + low mood (Casey Park)
const caseyHealth = [
  { day: 'Mon 7/10', hrv: 48, rhr: 58, sleepHours: 6.0, sleepDeep: 15, sleepREM: 20, spo2: 96.8, respiratoryRate: 15.0, skinTemp: 36.6 },
  { day: 'Tue 7/11', hrv: 43, rhr: 60, sleepHours: 5.2, sleepDeep: 12, sleepREM: 17, spo2: 96.3, respiratoryRate: 15.8, skinTemp: 37.0 },
  { day: 'Wed 7/12', hrv: 38, rhr: 63, sleepHours: 4.5, sleepDeep: 10, sleepREM: 14, spo2: 95.8, respiratoryRate: 16.5, skinTemp: 37.2 },
  { day: 'Thu 7/13', hrv: 33, rhr: 65, sleepHours: 4.0, sleepDeep: 8, sleepREM: 12, spo2: 95.2, respiratoryRate: 17.0, skinTemp: 37.4 },
  { day: 'Fri 7/14', hrv: 30, rhr: 67, sleepHours: 3.8, sleepDeep: 7, sleepREM: 11, spo2: 95.0, respiratoryRate: 17.5, skinTemp: 37.6 },
  { day: 'Sat 7/15', hrv: 28, rhr: 68, sleepHours: 3.5, sleepDeep: 6, sleepREM: 10, spo2: 94.8, respiratoryRate: 18.0, skinTemp: 37.7 },
  { day: 'Sun 7/16', hrv: 26, rhr: 70, sleepHours: 3.2, sleepDeep: 5, sleepREM: 9, spo2: 94.5, respiratoryRate: 18.5, skinTemp: 37.8 },
]
const caseyTraining = DAYS.map((day, i) => ({
  day,
  distance: Math.max(0, Math.round(7000 - i * 800)),
  avgSplit: 118 + i * 4,
  avgSPM: Math.round(26 - i * 0.8),
  maxHR: Math.round(168 + i * 4),
  avgHR: Math.round(150 + i * 3),
  duration: Math.round(40 - i * 4),
}))
const caseyCheckins = DAYS.map((day, i) => ({
  day,
  mood: Math.max(1, Math.min(5, Math.round(2 - i * 0.3))),
  motivation: Math.max(1, Math.min(10, Math.round(4 - i * 0.8))),
  fatigue: Math.max(1, Math.min(10, Math.round(6 + i * 0.6))),
  challenge: i > 2 ? 'mental_fatigue' : 'physical_fatigue',
  journal: i > 4 ? 'I feel invisible. Nobody notices I\'m drowning.' : 'Barely holding on. Don\'t know how much longer.',
}))

// Athlete 5 — Stable, good shape (Riley Kim)
const rileyHealth = generateDailyData(68, 50, 8.2, 1.0)
const rileyTraining = generateTrainingData(110)
const rileyCheckins = DAYS.map((day, i) => ({
  day,
  mood: 4 + Math.round((Math.random() - 0.5)),
  motivation: 8 + Math.round((Math.random() - 0.5) * 2),
  fatigue: 3 + Math.round((Math.random() - 0.3)),
  challenge: 'none',
  journal: 'Feeling strong today, ready to train',
}))

// Athlete 6 — Recovering, yellow to good (Taylor Brooks)
const taylorHealth = [
  { day: 'Mon 7/10', hrv: 44, rhr: 60, sleepHours: 5.5, sleepDeep: 14, sleepREM: 18, spo2: 96.8, respiratoryRate: 15.5, skinTemp: 36.8 },
  { day: 'Tue 7/11', hrv: 46, rhr: 59, sleepHours: 5.8, sleepDeep: 15, sleepREM: 19, spo2: 97.0, respiratoryRate: 15.2, skinTemp: 36.7 },
  { day: 'Wed 7/12', hrv: 49, rhr: 57, sleepHours: 6.2, sleepDeep: 17, sleepREM: 20, spo2: 97.1, respiratoryRate: 14.9, skinTemp: 36.6 },
  { day: 'Thu 7/13', hrv: 53, rhr: 55, sleepHours: 6.8, sleepDeep: 19, sleepREM: 22, spo2: 97.3, respiratoryRate: 14.6, skinTemp: 36.5 },
  { day: 'Fri 7/14', hrv: 57, rhr: 53, sleepHours: 7.2, sleepDeep: 21, sleepREM: 24, spo2: 97.5, respiratoryRate: 14.3, skinTemp: 36.4 },
  { day: 'Sat 7/15', hrv: 60, rhr: 52, sleepHours: 7.5, sleepDeep: 22, sleepREM: 25, spo2: 97.6, respiratoryRate: 14.1, skinTemp: 36.4 },
  { day: 'Sun 7/16', hrv: 63, rhr: 51, sleepHours: 7.8, sleepDeep: 23, sleepREM: 26, spo2: 97.7, respiratoryRate: 14.0, skinTemp: 36.3 },
]
const taylorTraining = DAYS.map((day, i) => ({
  day,
  distance: Math.round(6000 + i * 500),
  avgSplit: 113 - i,
  avgSPM: Math.round(28 + i * 0.3),
  maxHR: Math.round(178 - i),
  avgHR: Math.round(150 - i),
  duration: Math.round(40 + i * 2),
}))
const taylorCheckins = DAYS.map((day, i) => ({
  day,
  mood: Math.min(5, Math.round(3 + i * 0.4)),
  motivation: Math.min(10, Math.round(5 + i * 0.7)),
  fatigue: Math.max(1, Math.round(7 - i * 0.6)),
  challenge: i < 2 ? 'mental_fatigue' : 'none',
  journal: i < 2 ? 'Coming back slowly, feeling better each day' : 'Back on track! Energy is returning',
}))

export const ATHLETES = [
  {
    id: 'ath-001',
    name: 'Alex Chen',
    sport: 'Rowing',
    position: 'Stroke Seat',
    school: 'University of Pennsylvania',
    team: 'Varsity Heavyweight 8+',
    age: 19,
    height: 191,
    weight: 86,
    yearsRowing: 4,
    health: alexHealth,
    training: alexTraining,
    checkins: alexCheckins,
    currentHRV: 64,
    currentRHR: 53,
    currentSleep: 7.7,
    hrvTrend: 'stable',
    status: 'good',
  },
  {
    id: 'ath-002',
    name: 'Jordan Lee',
    sport: 'Rowing',
    position: 'Bow Seat',
    school: 'University of Pennsylvania',
    team: 'Varsity Heavyweight 8+',
    age: 20,
    height: 188,
    weight: 82,
    yearsRowing: 3,
    health: jordanHealth,
    training: jordanTraining,
    checkins: jordanCheckins,
    currentHRV: 42,
    currentRHR: 60,
    currentSleep: 5.2,
    hrvTrend: 'declining',
    status: 'warning',
    alertLevel: 'yellow',
  },
  {
    id: 'ath-003',
    name: 'Morgan Smith',
    sport: 'Rowing',
    position: '3 Seat',
    school: 'University of Pennsylvania',
    team: 'Varsity Heavyweight 8+',
    age: 18,
    height: 196,
    weight: 89,
    yearsRowing: 2,
    health: morganHealth,
    training: morganTraining,
    checkins: morganCheckins,
    currentHRV: 30,
    currentRHR: 67,
    currentSleep: 4.0,
    hrvTrend: 'severe_decline',
    status: 'danger',
    alertLevel: 'red',
  },
  {
    id: 'ath-004',
    name: 'Casey Park',
    sport: 'Rowing',
    position: 'Coxswain',
    school: 'University of Pennsylvania',
    team: 'Varsity Heavyweight 8+',
    age: 19,
    height: 165,
    weight: 55,
    yearsRowing: 4,
    health: caseyHealth,
    training: caseyTraining,
    checkins: caseyCheckins,
    currentHRV: 26,
    currentRHR: 70,
    currentSleep: 3.2,
    hrvTrend: 'critical',
    status: 'urgent',
    alertLevel: 'black',
  },
  {
    id: 'ath-005',
    name: 'Riley Kim',
    sport: 'Rowing',
    position: '2 Seat',
    school: 'University of Washington',
    team: 'Varsity 8+',
    age: 21,
    height: 193,
    weight: 88,
    yearsRowing: 5,
    health: rileyHealth,
    training: rileyTraining,
    checkins: rileyCheckins,
    currentHRV: 67,
    currentRHR: 51,
    currentSleep: 8.1,
    hrvTrend: 'improving',
    status: 'good',
  },
  {
    id: 'ath-006',
    name: 'Taylor Brooks',
    sport: 'Rowing',
    position: '4 Seat',
    school: 'University of Washington',
    team: 'Varsity 8+',
    age: 20,
    height: 190,
    weight: 84,
    yearsRowing: 3,
    health: taylorHealth,
    training: taylorTraining,
    checkins: taylorCheckins,
    currentHRV: 63,
    currentRHR: 51,
    currentSleep: 7.8,
    hrvTrend: 'improving',
    status: 'good',
    recovering: true,
  },
]

// Stable alert generation based on rules from the spec
// Exported as a top-level constant so every render produces the same queue.
function buildAlerts(athletes) {
  const alerts = []
  athletes.forEach((ath) => {
    const last3 = ath.health.slice(-3)

    // Yellow: HRV declining 3 days + RHR rising 3 days
    const hrvDeclining = last3[0].hrv > last3[1].hrv && last3[1].hrv > last3[2].hrv
    const rhrRising = last3[0].rhr < last3[1].rhr && last3[1].rhr < last3[2].rhr
    if (hrvDeclining && rhrRising && !ath.alertLevel) {
      alerts.push({
        id: `alert-${ath.id}-recovery`,
        athleteId: ath.id,
        athleteName: ath.name,
        level: 'yellow',
        type: 'Recovery Deficiency',
        message: `HRV declined 3 consecutive days + RHR rising — possible overtraining`,
        severity: 'yellow',
        time: '2h ago',
        status: 'active',
        createdAt: '2026-07-16T13:00:00.000Z',
      })
    }

    // Yellow: Sleep < 6hrs for 3 days
    const sleepLow = last3.every(d => d.sleepHours < 6)
    if (sleepLow && (!ath.alertLevel || ath.alertLevel === 'yellow')) {
      alerts.push({
        id: `alert-${ath.id}-sleep`,
        athleteId: ath.id,
        athleteName: ath.name,
        level: 'yellow',
        type: 'Sleep Deprivation',
        message: `Sleep under 6 hours for 3 consecutive days — emotional vulnerability`,
        severity: 'yellow',
        time: '5h ago',
        status: 'active',
        createdAt: '2026-07-16T10:00:00.000Z',
      })
    }

    // Red: HRV down + poor sleep + training pace decline
    if (ath.alertLevel === 'red' || ath.status === 'danger') {
      alerts.push({
        id: `alert-${ath.id}-fatigue`,
        athleteId: ath.id,
        athleteName: ath.name,
        level: 'red',
        type: 'Physical & Mental Fatigue',
        message: `HRV critically low + sleep quality poor + training pace declining — high risk of burnout`,
        severity: 'red',
        time: '1h ago',
        status: 'active',
        createdAt: '2026-07-16T14:00:00.000Z',
      })
    }

    // Black: any combo + mood ≤2 for 2 days
    if (ath.alertLevel === 'black' || ath.status === 'urgent') {
      const lowMood = ath.checkins.slice(-2).every(c => c.mood <= 2)
      if (lowMood) {
        alerts.push({
          id: `alert-${ath.id}-crisis`,
          athleteId: ath.id,
          athleteName: ath.name,
          level: 'black',
          type: 'URGENT: Athlete in Crisis',
          message: `Multiple biometric warnings + persistently low mood score — coach intervention needed immediately`,
          severity: 'black',
          time: '30m ago',
          status: 'active',
          createdAt: '2026-07-16T14:30:00.000Z',
        })
      }
    }
  })
  return alerts.sort((a, b) => {
    const order = { black: 0, red: 1, yellow: 2 }
    return order[a.level] - order[b.level]
  })
}

export const ALERTS = buildAlerts(ATHLETES)

// Kept for backward compatibility; returns the stable ALERTS constant.
export function generateAlerts() {
  return ALERTS
}

// Weekly team aggregates
export function generateTeamAggregate(athletes) {
  const total = athletes.length
  const avgHRV = Math.round(athletes.reduce((s, a) => s + a.currentHRV, 0) / total)
  const avgRHR = Math.round(athletes.reduce((s, a) => s + a.currentRHR, 0) / total)
  const avgSleep = Math.round(athletes.reduce((s, a) => s + a.currentSleep, 0) / total * 10) / 10
  const healthyCount = athletes.filter(a => a.status === 'good').length
  const atRiskCount = athletes.filter(a => a.status !== 'good').length

  // Derive team/school from first athlete (for multi-school, separate calls)
  const firstAth = athletes[0]
  const schoolName = firstAth?.school || 'Team'
  const teamName = firstAth?.team || 'Squad'

  return {
    teamName: `${teamName} / ${schoolName}`,
    schoolName,
    teamNameShort: teamName,
    totalAthletes: total,
    avgHRV,
    avgRHR,
    avgSleep,
    healthyCount,
    atRiskCount,
    healthScore: Math.round((healthyCount / total) * 100),
    weeklySleepTrend: avgSleep < 7 ? 'below_ideal' : 'good',
  }
}
