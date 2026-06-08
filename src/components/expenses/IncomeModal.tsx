import { useState } from 'react'
import { X, Plus, Trash2, Copy } from 'lucide-react'
import { useExpensesStore } from '@/store/expensesStore'
import { formatBRL, parseAmount } from '@/lib/money'
import { sumAmounts } from '@/lib/expenseCalc'
import { monthLabel } from '@/lib/expenseMonth'

export function IncomeModal({ onClose }: { onClose: () => void }) {
  const month = useExpensesStore((s) => s.selectedMonth)
  const incomes = useExpensesStore((s) => s.incomes)
  const addIncome = useExpensesStore((s) => s.addIncome)
  const updateIncome = useExpensesStore((s) => s.updateIncome)
  const removeIncome = useExpensesStore((s) => s.removeIncome)
  const copyPrev = useExpensesStore((s) => s.copyIncomesFromPrevMonth)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const add = () => {
    if (!name.trim() || !amount) return
    addIncome(name.trim(), parseAmount(amount))
    setName(''); setAmount('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-tint-ink/30 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-md bg-card rounded-card shadow-drawer p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-cardTitle font-bold">Rendas · {monthLabel(month)}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {incomes.map((i) => (
            <div key={i.id} className="flex items-center gap-2 bg-cardAlt rounded-badge px-3 py-2">
              <input defaultValue={i.name} onBlur={(e) => e.target.value !== i.name && updateIncome(i.id, { name: e.target.value })} className="bg-transparent outline-none text-item flex-1" />
              <input defaultValue={String(i.amount)} onBlur={(e) => { const v = parseAmount(e.target.value); if (v !== i.amount) updateIncome(i.id, { amount: v }) }} className="bg-transparent outline-none text-item w-24 text-right" />
              <button onClick={() => removeIncome(i.id)} className="text-muted hover:text-tint-coral" aria-label="Excluir renda"><Trash2 size={15} /></button>
            </div>
          ))}
          {incomes.length === 0 && <p className="text-meta text-muted text-center py-2">Nenhuma renda neste mês.</p>}
        </div>

        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Salário)" className="flex-1 bg-cardAlt rounded-pill px-4 h-10 text-item outline-none" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="w-28 bg-cardAlt rounded-pill px-4 h-10 text-item outline-none" />
          <button onClick={add} className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0" aria-label="Adicionar renda"><Plus size={18} /></button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <button onClick={() => copyPrev()} className="inline-flex items-center gap-2 text-meta text-muted hover:text-ink">
            <Copy size={14} /> Copiar do mês passado
          </button>
          <span className="text-item font-bold">Total: {formatBRL(sumAmounts(incomes))}</span>
        </div>
      </div>
    </div>
  )
}
