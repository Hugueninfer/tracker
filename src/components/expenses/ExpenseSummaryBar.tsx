import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { useExpensesStore } from '@/store/expensesStore'
import { addMonths, monthLabel } from '@/lib/expenseMonth'
import { formatBRL } from '@/lib/money'
import { sumAmounts, balance } from '@/lib/expenseCalc'
import { cx } from '@/lib/utils'

export function ExpenseSummaryBar({ onOpenIncomes }: { onOpenIncomes: () => void }) {
  const month = useExpensesStore((s) => s.selectedMonth)
  const setMonth = useExpensesStore((s) => s.setMonth)
  const incomes = useExpensesStore((s) => s.incomes)
  const expenses = useExpensesStore((s) => s.expenses)

  const totalIncome = sumAmounts(incomes)
  const totalExpense = sumAmounts(expenses)
  const saldo = balance(incomes, expenses)

  const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'done' | 'coral' }) => (
    <div className="flex flex-col">
      <span className="text-meta text-muted">{label}</span>
      <span className={cx('text-stat font-bold', tone === 'done' && 'text-done', tone === 'coral' && 'text-tint-coral')}>{value}</span>
    </div>
  )

  return (
    <div className="bg-card rounded-card shadow-card p-card flex flex-wrap items-center gap-x-8 gap-y-4 justify-between">
      <div className="flex items-center gap-2">
        <button onClick={() => setMonth(addMonths(month, -1))} className="h-8 w-8 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted">
          <ChevronLeft size={16} />
        </button>
        <span className="text-cardTitle font-bold min-w-[8.5rem] text-center">{monthLabel(month)}</span>
        <button onClick={() => setMonth(addMonths(month, 1))} className="h-8 w-8 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-8">
        <Stat label="Rendas" value={formatBRL(totalIncome)} />
        <Stat label="Gastos" value={formatBRL(totalExpense)} />
        <Stat label="Saldo" value={formatBRL(saldo)} tone={saldo >= 0 ? 'done' : 'coral'} />
      </div>

      <button onClick={onOpenIncomes} className="inline-flex items-center gap-2 rounded-pill px-5 h-11 text-item font-semibold bg-accent text-white hover:scale-[1.02] transition-transform">
        <Wallet size={16} /> Rendas
      </button>
    </div>
  )
}
