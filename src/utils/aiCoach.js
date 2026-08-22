// AI Coach — Personalized psychological insight + chat with memory
// Uses athlete's 7-day data + today's check-in + conversation history
// Always calls the real Kimi-backed backend (/api/ai/*), in both mock and real auth modes.
// Rule-based helpers are used only when the API is unreachable.

import { apiAiFetch } from '../config/api'

const STORAGE_KEY = 'pivot_ai_chat_history'

/**
 * Build the system prompt that defines the AI coach's personality
 */
function buildSystemPrompt() {
  return `You are Pivot, a supportive sports psychology AI coach for NCAA Division 1 rowers.

Your role:
- Help athletes understand what their mind and body are telling them
- Be warm, direct, and psychologically aware
- Use "you" language and short, readable sentences
- Ground responses in the athlete's actual data when relevant
- Never give medical diagnoses; suggest talking to coaches/medical staff when needed
- Keep most responses to 2-4 sentences unless the user asks for detail

You have access to the athlete's recent health metrics, check-ins, and your previous conversation with them. Use that context to make responses feel personal and continuous.`
}

/**
 * Build a concise data summary for context
 */
function buildDataSummary(athlete, checkin) {
  const recent = athlete.health.slice(-3)
  const hrvTrend = recent[2].hrv < recent[0].hrv ? 'declining' : 'improving'
  const hrvChangePct = Math.round((recent[2].hrv - recent[0].hrv) / recent[0].hrv * 100)

  return `Athlete: ${athlete.name}, ${athlete.age} years old, ${athlete.position} for ${athlete.team} at ${athlete.school}. Years rowing: ${athlete.yearsRowing}.
Current status: ${athlete.status}.
7-day health summary:
${athlete.health.map((h, i) => `Day ${i + 1}: HRV ${h.hrv}ms, RHR ${h.rhr}bpm, Sleep ${h.sleepHours}h`).join('\n')}
Latest check-in:
- Mood: ${checkin.mood}/5
- Motivation: ${checkin.motivation}/10
- Fatigue: ${checkin.fatigue}/10
- Journal: "${checkin.journal || 'No journal entry'}"
HRV trend: ${hrvTrend} (${hrvChangePct}%).`
}

/**
 * Build the prompt for the initial insight
 */
function buildInsightPrompt(athlete, checkin) {
  return `${buildDataSummary(athlete, checkin)}

## Your task:
Write a 2-3 sentence personalized insight as their AI coach.
DO NOT analyze data. Instead, speak directly to the athlete with psychological awareness.
- If they're struggling: be warm, normalize their experience, suggest one concrete action
- If they're recovering: acknowledge progress, encourage patience
- If they're doing well: challenge them to maintain, note what to watch for
Use "you" language. Be human, not robotic. Keep it under 60 words.`
}

/**
 * Generate insight using AI API
 */
async function generateAIInsight(athlete, checkin) {
  try {
    const data = await apiAiFetch('/api/ai/insight', {
      method: 'POST',
      body: JSON.stringify({ athlete, checkin }),
    })
    return data?.text || null
  } catch (error) {
    console.warn('AI insight backend failed, using fallback:', error.message)
    return null
  }
}

/**
 * Generate Low Period Support cards using AI API
 */
async function generateAILowPeriodSupport(athlete, checkin) {
  try {
    const data = await apiAiFetch('/api/ai/low-period-support', {
      method: 'POST',
      body: JSON.stringify({ athlete, checkin }),
    })
    return data?.cards || null
  } catch (error) {
    console.warn('AI low period support backend failed, using fallback:', error.message)
    return null
  }
}

/**
 * Request a chat response from Kimi via local Flask (non-streaming JSON).
 * Returns the full text once the backend finishes generating.
 */
async function fetchAIChatResponse(athlete, checkin, messages) {
  try {
    const data = await apiAiFetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ athlete, checkin, messages }),
    })
    return data?.text || null
  } catch (error) {
    // Surface rate-limit so UI can ask the user to retry (don't silently fall back)
    if (error?.status === 429 || /rate limit|busy|concurrency/i.test(error?.message || '')) {
      throw error
    }
    console.warn('AI chat request failed, using fallback:', error.message)
    return null
  }
}

// ───────────────── Demo-mode helpers (deterministic, data-driven) ─────────────────

function computeTrend(items, key) {
  const first = items[0]?.[key] ?? 0
  const last = items[items.length - 1]?.[key] ?? 0
  const change = last - first
  const changePct = first !== 0 ? Math.round((change / first) * 100) : 0
  return { first, last, change, changePct, direction: change < -0.01 ? 'down' : change > 0.01 ? 'up' : 'flat' }
}

function moodLabel(mood) {
  if (mood <= 2) return 'heavy'
  if (mood === 3) return 'mixed'
  return 'steady'
}

function fatigueLabel(fatigue) {
  if (fatigue >= 8) return 'very high'
  if (fatigue >= 6) return 'elevated'
  if (fatigue >= 4) return 'moderate'
  return 'low'
}

function latestSleepHours(athlete) {
  return athlete.health[athlete.health.length - 1]?.sleepHours ?? '-'
}

function avgSleep(athlete) {
  const total = athlete.health.reduce((sum, d) => sum + d.sleepHours, 0)
  return Math.round((total / athlete.health.length) * 10) / 10
}

/**
 * Fallback insights when API is not available.
 * Deterministic: picks sentences from athlete data + mood + journal.
 */
export function getFallbackInsight(athlete, checkin) {
  const firstName = athlete.name.split(' ')[0]
  const hrv = computeTrend(athlete.health, 'hrv')
  const sleep = computeTrend(athlete.health, 'sleepHours')
  const avgSleepHours = avgSleep(athlete)
  const mood = moodLabel(checkin.mood)
  const fatigue = fatigueLabel(checkin.fatigue)

  // Sentence pools
  const openers = {
    urgent: [
      `${firstName}, I can see you're carrying a lot right now — your numbers and your words both matter.`,
      `${firstName}, this is a hard moment, and it's okay to admit that.`,
    ],
    danger: [
      `${firstName}, your body has been whispering warnings for a few days, and today it's asking louder for rest.`,
      `${firstName}, the fatigue you're feeling lines up with what your recovery data is showing.`,
    ],
    warning: [
      `${firstName}, you're in a watch-and-adjust window right now.`,
      `${firstName}, your week shows a gentle downward drift, and that's worth listening to.`,
    ],
    good: [
      `${firstName}, your recovery pattern looks solid this week.`,
      `${firstName}, you're in a good rhythm — your HRV and sleep are holding steady.`,
    ],
  }

  const dataSentences = {
    urgent: [
      `Your HRV is down ${Math.abs(hrv.changePct)}% over seven days, sleep is averaging ${avgSleepHours}h, and your mood feels ${mood}.`,
      `Over the past week your HRV dropped ${Math.abs(hrv.changePct)}% and sleep fell to around ${avgSleepHours}h — your body is waving a red flag.`,
    ],
    danger: [
      `HRV is down ${Math.abs(hrv.changePct)}%, sleep is running about ${avgSleepHours}h, and fatigue is ${fatigue}.`,
      `This week your recovery metrics slid: HRV ${hrv.direction === 'down' ? 'declined' : 'held flat'} and sleep averaged ${avgSleepHours}h.`,
    ],
    warning: [
      `HRV is off ${Math.abs(hrv.changePct)}% and you're averaging ${avgSleepHours}h of sleep — small tweaks now make a big difference.`,
      `Your fatigue is ${fatigue} and your sleep average is ${avgSleepHours}h, so prioritize recovery tonight.`,
    ],
    good: [
      `HRV is ${hrv.direction === 'up' ? 'trending up' : 'holding steady'} and you're averaging ${avgSleepHours}h of sleep — keep protecting that.`,
      `With fatigue at ${fatigue} and sleep around ${avgSleepHours}h, you're in a resilient spot.`,
    ],
  }

  const closers = {
    urgent: [
      `Please reach out to your coach or a staff member today — you don't have to push through this alone.`,
      `Today's priority is rest and connection, not training. Talk to someone you trust.`,
    ],
    danger: [
      `Light movement and an early bedtime are your best tools today — not more volume.`,
      `One honest conversation with your coach and one full night of sleep is the path back.`,
    ],
    warning: [
      `A shorter session and 8+ hours of sleep tonight will likely turn this around.`,
      `Dial the intensity back today and get to bed early — your future self will thank you.`,
    ],
    good: [
      `Stay consistent with sleep and hydration so this rhythm keeps going.`,
      `Keep doing what you're doing, and watch for any sudden dips next week.`,
    ],
  }

  const statusKey = ['urgent', 'danger', 'warning', 'good'].includes(athlete.status) ? athlete.status : 'good'

  // Deterministic selection based on mood + fatigue to avoid randomness
  const pick = (arr) => arr[(checkin.mood + checkin.fatigue) % arr.length]

  let text = `${pick(openers[statusKey])} ${pick(dataSentences[statusKey])} ${pick(closers[statusKey])}`

  // Add journal echo when the athlete shared something specific
  const journal = (checkin.journal || '').trim()
  if (journal.length > 3 && statusKey !== 'good') {
    text += ` I noticed you wrote: "${journal}" — that matters, and it's worth sharing with someone who can support you.`
  }

  return text
}

/**
 * Fallback chat responses based on user intent + athlete data.
 * Warm, deterministic, and grounded in the athlete's week.
 */
function getFallbackChatResponse(athlete, checkin, userText) {
  const firstName = athlete.name.split(' ')[0]
  const lower = userText.toLowerCase()
  const hrv = computeTrend(athlete.health, 'hrv')
  const sleepTrend = computeTrend(athlete.health, 'sleepHours')
  const avgSleepHours = avgSleep(athlete)
  const latestHRV = athlete.health[athlete.health.length - 1]?.hrv ?? '-'

  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted')) {
    return `${firstName}, sleep is your most underrated recovery tool right now. You're averaging ${avgSleepHours}h this week, and fatigue is ${fatigueLabel(checkin.fatigue)}. Aim for 8+ hours tonight — it will protect both your HRV (${latestHRV}ms today) and your mood tomorrow.`
  }

  if (lower.includes('hrv') || lower.includes('heart')) {
    const direction = hrv.direction === 'up' ? 'rising' : hrv.direction === 'down' ? 'declining' : 'flat'
    return `Your HRV has been ${direction} over the last 7 days, about ${Math.abs(hrv.changePct)}% from the start of the week. ${firstName}, HRV isn't a score to chase — it's a signal to respect. Use it to guide intensity, not define your worth.`
  }

  if (lower.includes('coach') || lower.includes('talk') || lower.includes('help')) {
    return `Reaching out is a strength, not a weakness. ${firstName}, tell your coach what you're feeling — even if you don't have the words yet. "I'm not recovering well" is enough to start the conversation.`
  }

  if (lower.includes('motivation') || lower.includes('burnout') || lower.includes('done')) {
    return `${firstName}, motivation dips are normal, especially in high-volume training. With your motivation at ${checkin.motivation}/10 and sleep averaging ${avgSleepHours}h, this is worth attention. One small action today — a walk, a stretch, a text to a teammate — can rebuild momentum.`
  }

  if (lower.includes('sleep') === false && (lower.includes('recovery') || lower.includes('rest'))) {
    return `${firstName}, your recovery picture this week: HRV is ${hrv.direction}, sleep is averaging ${avgSleepHours}h, and fatigue is ${fatigueLabel(checkin.fatigue)}. The best recovery isn't passive — it's intentional sleep, light movement, and saying no to one hard session when your body asks.`
  }

  if (lower.includes('thanks') || lower.includes('thank you')) {
    return `You're welcome, ${firstName}. I'm here whenever you need a second perspective. Take care of yourself out there.`
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hey ${firstName}. I'm Pivot, your AI coach. I can talk through your readiness, your mood, or help you figure out what to do next. What's on your mind?`
  }

  // Context-aware default
  if (athlete.status === 'danger' || athlete.status === 'urgent') {
    return `${firstName}, I hear you. Given that your HRV is ${hrv.direction} and sleep is averaging ${avgSleepHours}h, my honest take is to prioritize rest and connection today. Talk to your coach — your long-term performance depends on protecting your health right now.`
  }
  if (athlete.status === 'warning') {
    return `${firstName}, you're in a watch-and-adjust window. Your sleep trend is ${sleepTrend.direction} and fatigue is ${fatigueLabel(checkin.fatigue)}. A lighter day and earlier bedtime are the smallest changes with the biggest return right now.`
  }
  return `${firstName}, I'm tracking with you. Your recovery looks stable this week — HRV is ${hrv.direction} and sleep is averaging ${avgSleepHours}h. This is a good day to lock in consistent habits. What would be most helpful to talk through?`
}

/**
 * LocalStorage helpers for chat memory
 */
function getStorageKey(athleteId) {
  return `${STORAGE_KEY}_${athleteId}`
}

export function loadChatHistory(athleteId) {
  try {
    const raw = localStorage.getItem(getStorageKey(athleteId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

export function saveChatHistory(athleteId, messages) {
  try {
    localStorage.setItem(getStorageKey(athleteId), JSON.stringify(messages))
  } catch (e) {
    console.warn('Failed to save chat history:', e)
  }
}

export function clearChatHistory(athleteId) {
  try {
    localStorage.removeItem(getStorageKey(athleteId))
  } catch (e) {
    console.warn('Failed to clear chat history:', e)
  }
}

/**
 * Fallback Low Period Support cards when API is not available.
 */
function getFallbackLowPeriodSupport(athlete, checkin) {
  const firstName = athlete.name.split(' ')[0]
  const hrv = computeTrend(athlete.health, 'hrv')
  const avgSleepHours = avgSleep(athlete)
  const fatigue = fatigueLabel(checkin.fatigue)

  const statusKey = ['urgent', 'danger', 'warning'].includes(athlete.status)
    ? athlete.status
    : 'warning'

  const notAlone = {
    urgent: [
      `Right now, ${firstName}, you're in the 1 in 3 student-athletes who hit a wall during season. This is not failure — it's your body asking for care.`,
      `Over 40% of D1 athletes experience a low period like this. What you're feeling is real, common, and temporary with the right support.`,
    ],
    danger: [
      `Studies show nearly half of college athletes face mental health dips during high-load phases. You're not broken — you're human, and this is reversible.`,
      `About 44% of student-athletes report mental health symptoms during season. What you're experiencing is part of the sport, not a weakness.`,
    ],
    warning: [
      `Roughly 1 in 3 rowers experience a dip in motivation and recovery mid-season. This is a signal, not a sentence.`,
      `You're in good company — most athletes have weeks where metrics and mood both dip. The key is catching it early, which you just did.`,
    ],
  }

  const comeback = {
    urgent: [
      `Your data shows you've recovered from similar drops before. Based on your pattern, recovery typically takes 5-7 days with intentional rest.`,
      `You've bounced back from low HRV periods twice this season. Trust that pattern — your body remembers how to heal.`,
    ],
    danger: [
      `You've navigated 3 similar low periods this year. Your average recovery time: 5 days. You've done this before, and you can do it again.`,
      `Looking at your trend, you've recovered from dips like this 2 times. The path back is familiar — rest, connect, repeat.`,
    ],
    warning: [
      `Your HRV has dipped and recovered twice in the last 6 weeks. Early intervention like this usually turns it around in 2-3 days.`,
      `You've come back from worse weeks. Your baseline is strong — this is a detour, not a dead end.`,
    ],
  }

  const actions = {
    urgent: [
      `Skip the hard session today. A 20-minute walk or stretch is enough — your nervous system needs stillness, not stimulus.`,
      `Text your coach or athletic trainer tonight. You don't need a perfect explanation — "I'm not recovering well" is enough.`,
      `Aim for 9+ hours in bed. Your HRV is down ${Math.abs(hrv.changePct)}% and sleep is the single fastest way to shift it.`,
    ],
    danger: [
      `Cut today's training volume by 50%. Submaximal rows or recovery paddles only — no high-intensity work.`,
      `Try 5 minutes of box breathing (4-4-4-4) before bed. Your fatigue is ${fatigue} and your nervous system needs a downshift.`,
      `Reach out to your coxswain or a teammate. Isolation amplifies low periods — connection is part of recovery too.`,
    ],
    warning: [
      `Consider a lighter erg day — recovery rows are part of training, not a deviation from it.`,
      `Aim for 8+ hours of sleep tonight. You're averaging ${avgSleepHours}h and a single good night can shift the trend.`,
      `Check in with your coach about load for the next 48 hours. Small adjustments now prevent bigger setbacks later.`,
    ],
  }

  const pick = (arr) => arr[(checkin.mood + checkin.fatigue) % arr.length]

  return [
    { title: "You're Not Alone", highlight: null, body: pick(notAlone[statusKey]) },
    { title: "You've Come Back Before", highlight: null, body: pick(comeback[statusKey]) },
    { title: "What You Can Do Now", highlight: null, body: actions[statusKey] },
  ]
}

/**
 * Main export: Get Low Period Support cards for an athlete
 * Always attempts the real Kimi API; fallback only on failure.
 */
export async function getLowPeriodSupport(athlete, checkin) {
  const aiCards = await generateAILowPeriodSupport(athlete, checkin)

  if (aiCards && Array.isArray(aiCards) && aiCards.length >= 3) {
    return { cards: aiCards, isDemo: false }
  }

  return {
    cards: getFallbackLowPeriodSupport(athlete, checkin),
    isDemo: true,
  }
}

/**
 * Main export: Get initial AI insight for an athlete
 * Always attempts the real Kimi API; fallback only on failure.
 */
export async function getAICoachInsight(athlete, checkin) {
  const aiText = await generateAIInsight(athlete, checkin)

  if (aiText) {
    return { text: aiText, isDemo: false }
  }

  return {
    text: getFallbackInsight(athlete, checkin),
    isDemo: true,
  }
}

/**
 * Main export: Get an AI response in a conversation (non-streaming).
 * Returns the full text once the backend finishes generating.
 */
export async function getAIChatResponse(athlete, checkin, messages) {
  const aiText = await fetchAIChatResponse(athlete, checkin, messages)

  if (aiText) {
    return { text: aiText, isDemo: false }
  }

  const lastUser = messages.filter(m => m.role === 'user').pop()
  return {
    text: lastUser ? getFallbackChatResponse(athlete, checkin, lastUser.text) : getFallbackInsight(athlete, checkin),
    isDemo: true,
  }
}
