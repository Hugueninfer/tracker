import { create } from 'zustand'
import type { PaymentCard, ExpenseCategory, Income, Expense } from '@/lib/types'
import type { DBExpense } from '@/lib/db-types'
import { useAuthStore } from '@/store/authStore'
import { currentMonth, buildInstallments, monthOf } from '@/lib/expenseMonth'
import * as api from '@/lib/api/expenses'

function toExpense(r: DBExpense): Expense {
  return {
    id: r.id, date: r.date, month: r.month, name: r.name,
    categoryId: r.category_id, cardId: r.card_id, amount: Number(r.amount),
    installmentGroup: r.installment_group, installmentIndex: r.installment_index,
    installmentCount: r.installment_count,
  }
}

interface ExpensesState {
  selectedMonth: string
  cards: PaymentCard[]
  categories: ExpenseCategory[]
  incomes: Income[]
  expenses: Expense[]
  loaded: boolean
  loadGlobal: () => Promise<void>
  loadMonth: (month: string) => Promise<void>
  setMonth: (month: string) => Promise<void>
  // cards / categories (global)
  addCard: (name: string, tint: string) => Promise<PaymentCard | undefined>
  renameCard: (id: string, name: string) => Promise<void>
  setCardTint: (id: string, tint: string) => Promise<void>
  removeCard: (id: string) => Promise<void>
  addCategory: (name: string, tint: string) => Promise<ExpenseCategory | undefined>
  renameCategory: (id: string, name: string) => Promise<void>
  setCategoryTint: (id: string, tint: string) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  // incomes (month)
  addIncome: (name: string, amount: number) => Promise<void>
  updateIncome: (id: string, patch: Partial<Pick<Income, 'name' | 'amount'>>) => Promise<void>
  removeIncome: (id: string) => Promise<void>
  copyIncomesFromPrevMonth: () => Promise<void>
  // expenses (month)
  addExpense: (input: { name: string; categoryId: string | null; cardId: string | null; amount: number; date: string; installments: number }) => Promise<void>
  updateExpense: (id: string, patch: Partial<Pick<Expense, 'name' | 'categoryId' | 'cardId' | 'amount' | 'date'>>) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  reset: () => void
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  selectedMonth: currentMonth(),
  cards: [],
  categories: [],
  incomes: [],
  expenses: [],
  loaded: false,

  loadGlobal: async () => {
    const [cards, categories] = await Promise.all([api.listCards(), api.listCategories()])
    set({
      cards: cards.map((c) => ({ id: c.id, name: c.name, tint: c.tint })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, tint: c.tint })),
    })
  },
  loadMonth: async (month) => {
    const [incomes, expenses] = await Promise.all([api.listIncomes(month), api.listExpenses(month)])
    set({
      selectedMonth: month,
      incomes: incomes.map((i) => ({ id: i.id, month: i.month, name: i.name, amount: Number(i.amount) })),
      expenses: expenses.map(toExpense),
      loaded: true,
    })
  },
  setMonth: async (month) => { await get().loadMonth(month) },

  addCard: async (name, tint) => {
    const userId = useAuthStore.getState().user!.id
    try {
      const row = await api.insertCard(userId, name, tint, get().cards.length)
      const card: PaymentCard = { id: row.id, name: row.name, tint: row.tint }
      set((s) => ({ cards: [...s.cards, card] }))
      return card
    } catch (e) { console.error('addCard failed', e); return undefined }
  },
  renameCard: async (id, name) => {
    const prev = get().cards
    set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, name } : c)) }))
    try { await api.updateCard(id, { name }) } catch (e) { console.error('renameCard failed', e); set({ cards: prev }) }
  },
  setCardTint: async (id, tint) => {
    const prev = get().cards
    set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, tint } : c)) }))
    try { await api.updateCard(id, { tint }) } catch (e) { console.error('setCardTint failed', e); set({ cards: prev }) }
  },
  removeCard: async (id) => {
    const prevCards = get().cards
    const prevExpenses = get().expenses
    set((s) => ({
      cards: s.cards.filter((c) => c.id !== id),
      expenses: s.expenses.map((e) => (e.cardId === id ? { ...e, cardId: null } : e)),
    }))
    try { await api.deleteCard(id) } catch (e) { console.error('removeCard failed', e); set({ cards: prevCards, expenses: prevExpenses }) }
  },
  addCategory: async (name, tint) => {
    const userId = useAuthStore.getState().user!.id
    try {
      const row = await api.insertCategory(userId, name, tint, get().categories.length)
      const cat: ExpenseCategory = { id: row.id, name: row.name, tint: row.tint }
      set((s) => ({ categories: [...s.categories, cat] }))
      return cat
    } catch (e) { console.error('addCategory failed', e); return undefined }
  },
  renameCategory: async (id, name) => {
    const prev = get().categories
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)) }))
    try { await api.updateCategory(id, { name }) } catch (e) { console.error('renameCategory failed', e); set({ categories: prev }) }
  },
  setCategoryTint: async (id, tint) => {
    const prev = get().categories
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, tint } : c)) }))
    try { await api.updateCategory(id, { tint }) } catch (e) { console.error('setCategoryTint failed', e); set({ categories: prev }) }
  },
  removeCategory: async (id) => {
    const prevCats = get().categories
    const prevExpenses = get().expenses
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      expenses: s.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: null } : e)),
    }))
    try { await api.deleteCategory(id) } catch (e) { console.error('removeCategory failed', e); set({ categories: prevCats, expenses: prevExpenses }) }
  },

  addIncome: async (name, amount) => {
    const userId = useAuthStore.getState().user!.id
    const month = get().selectedMonth
    try {
      const row = await api.insertIncome(userId, month, name, amount)
      set((s) => ({ incomes: [...s.incomes, { id: row.id, month, name, amount }] }))
    } catch (e) { console.error('addIncome failed', e) }
  },
  updateIncome: async (id, patch) => {
    const prev = get().incomes
    set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
    try { await api.updateIncome(id, patch) } catch (e) { console.error('updateIncome failed', e); set({ incomes: prev }) }
  },
  removeIncome: async (id) => {
    const prev = get().incomes
    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }))
    try { await api.deleteIncome(id) } catch (e) { console.error('removeIncome failed', e); set({ incomes: prev }) }
  },
  copyIncomesFromPrevMonth: async () => {
    const userId = useAuthStore.getState().user!.id
    const month = get().selectedMonth
    const prevMonth = (await import('@/lib/expenseMonth')).addMonths(month, -1)
    const prevIncomes = await api.listIncomes(prevMonth)
    for (const pi of prevIncomes) {
      const row = await api.insertIncome(userId, month, pi.name, Number(pi.amount))
      set((s) => ({ incomes: [...s.incomes, { id: row.id, month, name: pi.name, amount: Number(pi.amount) }] }))
    }
  },

  addExpense: async (input) => {
    const userId = useAuthStore.getState().user!.id
    const month = get().selectedMonth
    const rows = buildInstallments({ date: input.date, amount: input.amount, count: input.installments })
    const payload = rows.map((r, idx) => ({
      date: r.date, month: r.month, name: input.name,
      category_id: input.categoryId, card_id: input.cardId, amount: r.amount,
      installment_group: r.installmentGroup, installment_index: r.installmentIndex,
      installment_count: r.installmentCount, position: get().expenses.length + idx,
    }))
    try {
      const inserted = await api.insertExpenses(userId, payload)
      // only the rows in the currently-viewed month go into local state
      const here = inserted.filter((r) => r.month === month).map(toExpense)
      if (here.length) set((s) => ({ expenses: [...s.expenses, ...here] }))
    } catch (e) { console.error('addExpense failed', e) }
  },
  updateExpense: async (id, patch) => {
    const prev = get().expenses
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
    const dbPatch: Partial<DBExpense> = {}
    if ('name' in patch) dbPatch.name = patch.name
    if ('categoryId' in patch) dbPatch.category_id = patch.categoryId ?? null
    if ('cardId' in patch) dbPatch.card_id = patch.cardId ?? null
    if ('amount' in patch) dbPatch.amount = patch.amount
    if ('date' in patch && patch.date) { dbPatch.date = patch.date; dbPatch.month = monthOf(patch.date) }
    try {
      await api.updateExpense(id, dbPatch)
      // if date moved the expense out of this month, drop it locally
      if (dbPatch.month && dbPatch.month !== get().selectedMonth) {
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
      }
    } catch (e) { console.error('updateExpense failed', e); set({ expenses: prev }) }
  },
  removeExpense: async (id) => {
    const prev = get().expenses
    const target = prev.find((e) => e.id === id)
    const group = target?.installmentGroup ?? null
    // installment purchase -> remove the whole group (every adjacent month)
    set((s) => ({
      expenses: s.expenses.filter((e) => (group ? e.installmentGroup !== group : e.id !== id)),
    }))
    try {
      if (group) await api.deleteExpenseGroup(group)
      else await api.deleteExpense(id)
    } catch (e) { console.error('removeExpense failed', e); set({ expenses: prev }) }
  },

  reset: () => set({ cards: [], categories: [], incomes: [], expenses: [], loaded: false, selectedMonth: currentMonth() }),
}))
