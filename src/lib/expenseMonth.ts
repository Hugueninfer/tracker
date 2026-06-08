const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7)
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// month: "YYYY-MM" + n months (n can be negative) -> "YYYY-MM"
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12 + 12) % 12
  return `${ny}-${String(nm + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTHS_FULL[m - 1]} ${y}`
}

export interface InstallmentRow {
  date: string // YYYY-MM-DD
  month: string // YYYY-MM
  amount: number
  installmentGroup: string | null
  installmentIndex: number
  installmentCount: number
}

// Build N installment rows from a base date. Day is clamped to each month's length.
export function buildInstallments(opts: { date: string; amount: number; count: number }): InstallmentRow[] {
  const count = Math.max(1, Math.floor(opts.count || 1))
  const group = count > 1 ? crypto.randomUUID() : null
  const [y, m, d] = opts.date.split('-').map(Number)
  const rows: InstallmentRow[] = []
  for (let i = 0; i < count; i++) {
    const total = y * 12 + (m - 1) + i
    const ny = Math.floor(total / 12)
    const nm = (total % 12 + 12) % 12 // 0-based
    const lastDay = new Date(ny, nm + 1, 0).getDate()
    const day = Math.min(d, lastDay)
    const dateISO = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    rows.push({
      date: dateISO,
      month: `${ny}-${String(nm + 1).padStart(2, '0')}`,
      amount: opts.amount,
      installmentGroup: group,
      installmentIndex: i + 1,
      installmentCount: count,
    })
  }
  return rows
}
