import { supabase } from '@/lib/supabase'
import type { DBPaymentCard, DBExpenseCategory, DBIncome, DBExpense } from '@/lib/db-types'

// ---- global: cards & categories ----
export async function listCards(): Promise<DBPaymentCard[]> {
  const { data, error } = await supabase.from('payment_cards').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function listCategories(): Promise<DBExpenseCategory[]> {
  const { data, error } = await supabase.from('expense_categories').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function insertCard(userId: string, name: string, tint: string, position: number): Promise<DBPaymentCard> {
  const { data, error } = await supabase.from('payment_cards')
    .insert({ user_id: userId, name, tint, position }).select().single()
  if (error) throw error
  return data
}
export async function updateCard(id: string, patch: Partial<DBPaymentCard>): Promise<void> {
  const { error } = await supabase.from('payment_cards').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('payment_cards').delete().eq('id', id)
  if (error) throw error
}
export async function insertCategory(userId: string, name: string, tint: string, position: number): Promise<DBExpenseCategory> {
  const { data, error } = await supabase.from('expense_categories')
    .insert({ user_id: userId, name, tint, position }).select().single()
  if (error) throw error
  return data
}
export async function updateCategory(id: string, patch: Partial<DBExpenseCategory>): Promise<void> {
  const { error } = await supabase.from('expense_categories').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)
  if (error) throw error
}

// ---- per month: incomes ----
export async function listIncomes(month: string): Promise<DBIncome[]> {
  const { data, error } = await supabase.from('incomes').select('*').eq('month', month)
  if (error) throw error
  return data ?? []
}
export async function insertIncome(userId: string, month: string, name: string, amount: number): Promise<DBIncome> {
  const { data, error } = await supabase.from('incomes')
    .insert({ user_id: userId, month, name, amount }).select().single()
  if (error) throw error
  return data
}
export async function updateIncome(id: string, patch: Partial<DBIncome>): Promise<void> {
  const { error } = await supabase.from('incomes').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}

// ---- per month: expenses ----
export async function listExpenses(month: string): Promise<DBExpense[]> {
  const { data, error } = await supabase.from('expenses').select('*').eq('month', month).order('position')
  if (error) throw error
  return data ?? []
}
export type NewExpenseRow = Omit<DBExpense, 'id' | 'user_id'>
export async function insertExpenses(userId: string, rows: NewExpenseRow[]): Promise<DBExpense[]> {
  const payload = rows.map((r) => ({ ...r, user_id: userId }))
  const { data, error } = await supabase.from('expenses').insert(payload).select()
  if (error) throw error
  return data ?? []
}
export async function updateExpense(id: string, patch: Partial<DBExpense>): Promise<void> {
  const { error } = await supabase.from('expenses').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
// Deletes every installment row sharing the same group (all adjacent months).
export async function deleteExpenseGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('installment_group', groupId)
  if (error) throw error
}
