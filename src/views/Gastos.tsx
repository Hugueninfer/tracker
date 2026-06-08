import { useState } from 'react'
import { ExpenseSummaryBar } from '@/components/expenses/ExpenseSummaryBar'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { CardTotals } from '@/components/expenses/CardTotals'
import { IncomeModal } from '@/components/expenses/IncomeModal'

export function Gastos() {
  const [incomeOpen, setIncomeOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <ExpenseSummaryBar onOpenIncomes={() => setIncomeOpen(true)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ExpenseTable />
        </div>
        <div className="flex flex-col gap-5">
          <CardTotals />
        </div>
      </div>
      {incomeOpen && <IncomeModal onClose={() => setIncomeOpen(false)} />}
    </div>
  )
}
