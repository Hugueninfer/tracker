const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const NO_CARD = '__none__'

export function sumAmounts(items: { amount: number }[]): number {
  return round2(items.reduce((s, i) => s + i.amount, 0))
}

export function balance(incomes: { amount: number }[], expenses: { amount: number }[]): number {
  return round2(sumAmounts(incomes) - sumAmounts(expenses))
}

export function perCard(expenses: { cardId: string | null; amount: number }[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const e of expenses) {
    const key = e.cardId ?? NO_CARD
    map[key] = round2((map[key] ?? 0) + e.amount)
  }
  return map
}
