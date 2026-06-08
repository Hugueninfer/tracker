import { useExpensesStore } from '@/store/expensesStore'
import { perCard, NO_CARD, sumAmounts } from '@/lib/expenseCalc'
import { colorById } from '@/lib/expenseColors'
import { formatBRL } from '@/lib/money'

export function CardTotals() {
  const cards = useExpensesStore((s) => s.cards)
  const expenses = useExpensesStore((s) => s.expenses)

  const totals = perCard(expenses)
  const rows = [
    ...cards.map((c) => ({ id: c.id, name: c.name, tint: c.tint, value: totals[c.id] ?? 0 })),
    ...(totals[NO_CARD] ? [{ id: NO_CARD, name: 'Sem cartão', tint: '__none__', value: totals[NO_CARD] }] : []),
  ].filter((r) => r.value > 0)
  const total = sumAmounts(expenses)

  return (
    <div className="bg-card rounded-card shadow-card p-card">
      <h2 className="text-cardTitle font-bold mb-4">Total por cartão</h2>
      {rows.length === 0 ? (
        <p className="text-meta text-muted py-4 text-center">Sem gastos ainda.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3">
              {r.id === NO_CARD ? (
                <span className="text-micro font-semibold px-2.5 py-1 rounded-pill bg-cardAlt text-muted">{r.name}</span>
              ) : (
                <span className="text-micro font-semibold px-2.5 py-1 rounded-pill" style={{ backgroundColor: colorById(r.tint).bg, color: colorById(r.tint).fg }}>{r.name}</span>
              )}
              <span className="text-item font-semibold">{formatBRL(r.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-hairline">
            <span className="text-meta text-muted">Total</span>
            <span className="text-item font-bold">{formatBRL(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
