import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useExpensesStore } from '@/store/expensesStore'
import { formatBRL, parseAmount } from '@/lib/money'
import { currentMonthFirstDay } from '@/components/expenses/expenseFormUtils'
import { ManageModal } from '@/components/expenses/ManageModal'
import { CreateEntityModal } from '@/components/expenses/CreateEntityModal'
import { EntitySelect, type SelectOption } from '@/components/expenses/EntitySelect'
import type { Expense } from '@/lib/types'

type CreateKind = { type: 'card' | 'category'; target: 'new' | string }

const GRID = 'grid-cols-[2fr_1.4fr_1.4fr_1fr_1.2fr_0.6fr_auto]'

export function ExpenseTable() {
  const expenses = useExpensesStore((s) => s.expenses)
  const cards = useExpensesStore((s) => s.cards)
  const categories = useExpensesStore((s) => s.categories)
  const month = useExpensesStore((s) => s.selectedMonth)
  const addExpense = useExpensesStore((s) => s.addExpense)
  const updateExpense = useExpensesStore((s) => s.updateExpense)
  const removeExpense = useExpensesStore((s) => s.removeExpense)
  const addCard = useExpensesStore((s) => s.addCard)
  const addCategory = useExpensesStore((s) => s.addCategory)

  // new-row form state
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(currentMonthFirstDay(month))
  const [installments, setInstallments] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [create, setCreate] = useState<CreateKind | null>(null)

  const onCreateEntity = async (entityName: string, colorId: string) => {
    if (!create) return
    if (create.type === 'card') {
      const c = await addCard(entityName, colorId)
      if (c) { if (create.target === 'new') setCardId(c.id); else updateExpense(create.target, { cardId: c.id }) }
    } else {
      const c = await addCategory(entityName, colorId)
      if (c) { if (create.target === 'new') setCategoryId(c.id); else updateExpense(create.target, { categoryId: c.id }) }
    }
  }

  const submit = () => {
    if (!name.trim() || !amount) return
    addExpense({
      name: name.trim(), categoryId, cardId,
      amount: parseAmount(amount), date,
      installments: parseInt(installments || '1', 10) || 1,
    })
    setName(''); setCategoryId(null); setCardId(null); setAmount(''); setInstallments(''); setDate(currentMonthFirstDay(month))
  }

  const catOptions: SelectOption[] = categories.map((c) => ({ id: c.id, name: c.name, tint: c.tint }))
  const cardOptions: SelectOption[] = cards.map((c) => ({ id: c.id, name: c.name, tint: c.tint }))

  return (
    <div className="bg-card rounded-card shadow-card p-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-cardTitle font-bold">Gastos</h2>
        <button onClick={() => setManageOpen(true)} className="text-meta text-muted hover:text-ink">Gerenciar</button>
      </div>

      {/* desktop header */}
      <div className={`hidden sm:grid ${GRID} gap-2 text-micro text-muted px-2 mb-2`}>
        <span>Nome</span><span>Categoria</span><span>Cartão</span><span>Valor</span><span>Data</span><span>Parc.</span><span></span>
      </div>

      <div className="flex flex-col gap-2">
        {expenses.map((e: Expense) => (
          <div key={e.id}>
            {/* mobile card */}
            <div className="sm:hidden flex flex-col gap-2.5 bg-cardAlt rounded-card p-3">
              <div className="flex items-center gap-2">
                <input defaultValue={e.name} onBlur={(ev) => ev.target.value !== e.name && updateExpense(e.id, { name: ev.target.value })} placeholder="Nome" className="flex-1 bg-transparent outline-none text-item font-semibold" />
                {e.installmentCount > 1 && <span className="text-micro text-muted shrink-0">{e.installmentIndex}/{e.installmentCount}</span>}
                <button onClick={() => removeExpense(e.id)} className="text-muted hover:text-tint-coral shrink-0" aria-label="Excluir gasto"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <EntitySelect value={e.categoryId} options={catOptions} placeholder="Categoria" emptyLabel="Sem categoria" newLabel="Nova categoria" onChange={(id) => updateExpense(e.id, { categoryId: id })} onCreateNew={() => setCreate({ type: 'category', target: e.id })} />
                <EntitySelect value={e.cardId} options={cardOptions} placeholder="Cartão" emptyLabel="Sem cartão" newLabel="Novo cartão" onChange={(id) => updateExpense(e.id, { cardId: id })} onCreateNew={() => setCreate({ type: 'card', target: e.id })} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-card rounded-pill px-3 h-9 flex-1">
                  <span className="text-meta text-muted">R$</span>
                  <input defaultValue={String(e.amount)} onBlur={(ev) => { const v = parseAmount(ev.target.value); if (v !== e.amount) updateExpense(e.id, { amount: v }) }} className="bg-transparent outline-none text-item w-full min-w-0" />
                </div>
                <input type="date" defaultValue={e.date} onChange={(ev) => ev.target.value && updateExpense(e.id, { date: ev.target.value })} className="bg-card rounded-pill px-3 h-9 text-meta outline-none" />
              </div>
            </div>

            {/* desktop row */}
            <div className={`hidden sm:grid ${GRID} gap-2 items-center bg-cardAlt rounded-badge px-2 py-2`}>
              <input defaultValue={e.name} onBlur={(ev) => ev.target.value !== e.name && updateExpense(e.id, { name: ev.target.value })} className="bg-transparent outline-none text-item font-medium" />
              <EntitySelect value={e.categoryId} options={catOptions} placeholder="Categoria" emptyLabel="Sem categoria" newLabel="Nova categoria" onChange={(id) => updateExpense(e.id, { categoryId: id })} onCreateNew={() => setCreate({ type: 'category', target: e.id })} />
              <EntitySelect value={e.cardId} options={cardOptions} placeholder="Cartão" emptyLabel="Sem cartão" newLabel="Novo cartão" onChange={(id) => updateExpense(e.id, { cardId: id })} onCreateNew={() => setCreate({ type: 'card', target: e.id })} />
              <input defaultValue={String(e.amount)} onBlur={(ev) => { const v = parseAmount(ev.target.value); if (v !== e.amount) updateExpense(e.id, { amount: v }) }} className="bg-transparent outline-none text-item" />
              <input type="date" defaultValue={e.date} onChange={(ev) => ev.target.value && updateExpense(e.id, { date: ev.target.value })} className="bg-transparent outline-none text-meta" />
              <span className="text-micro text-muted">{e.installmentCount > 1 ? `${e.installmentIndex}/${e.installmentCount}` : '—'}</span>
              <button onClick={() => removeExpense(e.id)} className="text-muted hover:text-tint-coral justify-self-end" aria-label="Excluir gasto"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && <p className="text-meta text-muted text-center py-6">Nenhum gasto neste mês.</p>}
      </div>

      {/* new entry */}
      <div className="mt-3 pt-3 border-t border-hairline">
        {/* mobile form */}
        <div className="sm:hidden flex flex-col gap-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do gasto" className="bg-cardAlt rounded-pill px-4 h-10 text-item outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <EntitySelect value={categoryId} options={catOptions} placeholder="Categoria" emptyLabel="Sem categoria" newLabel="Nova categoria" onChange={setCategoryId} onCreateNew={() => setCreate({ type: 'category', target: 'new' })} />
            <EntitySelect value={cardId} options={cardOptions} placeholder="Cartão" emptyLabel="Sem cartão" newLabel="Novo cartão" onChange={setCardId} onCreateNew={() => setCreate({ type: 'card', target: 'new' })} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-cardAlt rounded-pill px-3 h-10 flex-1">
              <span className="text-meta text-muted">R$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-transparent outline-none text-item w-full min-w-0" />
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-cardAlt rounded-pill px-3 h-10 text-meta outline-none" />
            <input value={installments} onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ''))} placeholder="1x" className="bg-cardAlt rounded-pill px-2 h-10 text-item outline-none w-12 text-center" />
          </div>
          <button onClick={submit} className="inline-flex items-center justify-center gap-2 rounded-pill h-11 bg-accent text-white text-item font-semibold"><Plus size={16} /> Adicionar gasto</button>
        </div>

        {/* desktop form */}
        <div className={`hidden sm:grid ${GRID} gap-2 items-center`}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do gasto" className="bg-cardAlt rounded-pill px-3 h-9 text-item outline-none" />
          <EntitySelect value={categoryId} options={catOptions} placeholder="Categoria" emptyLabel="Sem categoria" newLabel="Nova categoria" onChange={setCategoryId} onCreateNew={() => setCreate({ type: 'category', target: 'new' })} />
          <EntitySelect value={cardId} options={cardOptions} placeholder="Cartão" emptyLabel="Sem cartão" newLabel="Novo cartão" onChange={setCardId} onCreateNew={() => setCreate({ type: 'card', target: 'new' })} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-cardAlt rounded-pill px-3 h-9 text-item outline-none" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-cardAlt rounded-pill px-2 h-9 text-item outline-none" />
          <input value={installments} onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ''))} placeholder="1x" className="bg-cardAlt rounded-pill px-2 h-9 text-item outline-none w-full" />
          <button onClick={submit} className="inline-flex items-center gap-1 rounded-pill px-3 h-9 bg-accent text-white text-item font-semibold justify-self-end"><Plus size={15} /></button>
        </div>
      </div>

      {/* totals footer */}
      <div className="flex justify-between sm:justify-end mt-4 text-item">
        <span className="text-muted mr-2">Total do mês:</span>
        <span className="font-bold">{formatBRL(expenses.reduce((s, e) => s + e.amount, 0))}</span>
      </div>

      {manageOpen && <ManageModal onClose={() => setManageOpen(false)} />}
      {create && (
        <CreateEntityModal
          title={create.type === 'card' ? 'Novo cartão' : 'Nova categoria'}
          placeholder={create.type === 'card' ? 'Nome do cartão' : 'Nome da categoria'}
          onCreate={onCreateEntity}
          onClose={() => setCreate(null)}
        />
      )}
    </div>
  )
}
