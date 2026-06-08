import { supabase } from '@/lib/supabase'
import type { DBColumn, DBCard } from '@/lib/db-types'

export async function listColumns(): Promise<DBColumn[]> {
  const { data, error } = await supabase.from('columns').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function listCards(): Promise<DBCard[]> {
  const { data, error } = await supabase.from('cards').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function insertColumn(userId: string, title: string, position: number): Promise<DBColumn> {
  const { data, error } = await supabase.from('columns')
    .insert({ user_id: userId, title, position }).select().single()
  if (error) throw error
  return data
}
export async function updateColumn(id: string, patch: Partial<DBColumn>): Promise<void> {
  const { error } = await supabase.from('columns').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id)
  if (error) throw error
}
export async function insertCard(userId: string, columnId: string, title: string, position: number): Promise<DBCard> {
  const { data, error } = await supabase.from('cards')
    .insert({ user_id: userId, column_id: columnId, title, position }).select().single()
  if (error) throw error
  return data
}
export async function updateCard(id: string, patch: Partial<DBCard>): Promise<void> {
  const { error } = await supabase.from('cards').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}
export async function setCardColumnAndPosition(id: string, columnId: string, position: number): Promise<void> {
  const { error } = await supabase.from('cards').update({ column_id: columnId, position }).eq('id', id)
  if (error) throw error
}
