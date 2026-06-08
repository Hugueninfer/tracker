// Pure helpers deriving doneToday / streak from completion dates (yyyy-mm-dd).
function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function isDoneToday(dates: string[]): boolean {
  return dates.includes(iso(new Date()))
}

export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const set = new Set(dates)
  const today = new Date()
  // start from today if done, else yesterday
  const cursor = new Date(today)
  if (!set.has(iso(today))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (set.has(iso(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
