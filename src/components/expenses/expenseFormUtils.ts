// First day of the given month (YYYY-MM), or today if it is the current month.
export function currentMonthFirstDay(month: string): string {
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (month === cur) return now.toISOString().slice(0, 10)
  return `${month}-01`
}
