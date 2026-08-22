/** Prefetch lazy-loaded athlete route chunks (B2). */
const prefetched = new Set()

export function prefetchAthleteRoute(path) {
  if (prefetched.has(path)) return
  prefetched.add(path)
  switch (path) {
    case '/athlete':
      import('../components/athlete/AthleteDashboard')
      break
    case '/athlete/checkin':
      import('../components/athlete/AthleteCheckinHistory')
      break
    case '/athlete/trends':
      import('../components/athlete/AthleteTrends')
      break
    case '/athlete/substitution':
      import('../components/athlete/AthleteSubstitutionPage')
      break
    default:
      break
  }
}

/** Prefetch all primary athlete tabs once auth is ready. */
export function prefetchAthleteTabs() {
  ;['/athlete', '/athlete/checkin', '/athlete/trends', '/athlete/substitution'].forEach(prefetchAthleteRoute)
}
