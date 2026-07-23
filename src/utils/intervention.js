// Intervention utilities — Coach intervention workflow

/**
 * Generate AI intervention suggestions based on alert type and athlete profile.
 * Returns suggestions that the coach can act on.
 */
export function getInterventionSuggestions(alert, athlete) {
  const firstName = athlete?.name?.split(' ')[0] || 'the athlete'

  const suggestionMap = {
    'Recovery Deficiency': [
      {
        id: 'nudge-recovery',
        title: 'Send Recovery Nudge',
        description: `Ask ${firstName} to prioritize recovery today and complete a check-in.`,
        action: 'nudge',
        icon: 'message',
        text: `Hi ${firstName}, your recovery metrics are trending down. Take it easy today and let us know how you're feeling.`,
        checkInPrompt: 'How are you feeling physically and mentally today?',
      },
      {
        id: 'meeting-recovery',
        title: 'Schedule 1-on-1 Check-in',
        description: `Set up a brief wellness conversation before or after practice.`,
        action: 'meeting',
        icon: 'calendar',
      },
      {
        id: 'adjust-recovery',
        title: 'Adjust Erg Volume',
        description: `Reduce ${firstName}'s erg volume for the next 48 hours.`,
        action: 'adjust',
        icon: 'activity',
      },
    ],
    'Sleep Deprivation': [
      {
        id: 'nudge-sleep',
        title: 'Send Sleep Hygiene Nudge',
        description: `Remind ${firstName} about sleep importance with crew-specific tips.`,
        action: 'nudge',
        icon: 'message',
        text: `Hi ${firstName}, sleep is your biggest recovery lever this week. Aim for 8 hours tonight and let us know how you wake up.`,
        checkInPrompt: 'How did you sleep last night?',
      },
      {
        id: 'meeting-sleep',
        title: 'Wellness Check-in',
        description: `Discuss potential causes of sleep disruption.`,
        action: 'meeting',
        icon: 'calendar',
      },
      {
        id: 'monitor-sleep',
        title: 'Monitor for 48hrs',
        description: `Track sleep pattern before the next water session.`,
        action: 'monitor',
        icon: 'eye',
      },
    ],
    'Physical & Mental Fatigue': [
      {
        id: 'nudge-fatigue',
        title: 'Send Support Nudge',
        description: `Let ${firstName} know you've noticed and are here to support.`,
        action: 'nudge',
        icon: 'message',
        text: `Hi ${firstName}, I've noticed your metrics and check-in suggest you're running low. Please take a moment to check in — we can adjust the plan.`,
        checkInPrompt: 'What feels hardest for you right now?',
      },
      {
        id: 'meeting-fatigue',
        title: 'Schedule Crew Wellness Talk',
        description: `Bring up recovery strategies in a 1-on-1 or crew meeting.`,
        action: 'meeting',
        icon: 'calendar',
      },
      {
        id: 'adjust-fatigue',
        title: 'Individual Recovery Plan',
        description: `Create a personalized 3-day recovery protocol.`,
        action: 'adjust',
        icon: 'activity',
      },
    ],
    'URGENT: Athlete in Crisis': [
      {
        id: 'nudge-crisis',
        title: 'Immediate Support Nudge',
        description: `Send ${firstName} an urgent check-in message.`,
        action: 'nudge',
        icon: 'message',
        urgent: true,
        text: `Hi ${firstName}, I'm here for you. Please check in right now so we can figure out the best next step together.`,
        checkInPrompt: 'Please share how you are doing right now — we are here to help.',
      },
      {
        id: 'meeting-crisis',
        title: 'Emergency 1-on-1',
        description: `Schedule an immediate conversation with the athlete and staff.`,
        action: 'meeting',
        icon: 'calendar',
        urgent: true,
      },
      {
        id: 'refer-crisis',
        title: 'Refer to Sports Psych',
        description: `Connect athlete with mental health resources.`,
        action: 'refer',
        icon: 'shield',
        urgent: true,
      },
    ],
  }

  // Find matching suggestions or use default
  const key = Object.keys(suggestionMap).find(k => alert.type.includes(k))
  return suggestionMap[key] || suggestionMap['Physical & Mental Fatigue']
}
