import { supabase } from '@/lib/supabase'
import type { DBHabit, DBCompletion } from '@/lib/db-types'

export async function listHabits(): Promise<DBHabit[]> {
  const { data, error } = await supabase.from('habits').select('*').order('position')
  if (error) throw error
  return data ?? []
}

export async function listCompletions(): Promise<DBCompletion[]> {
  const { data, error } = await supabase.from('habit_completions').select('*')
  if (error) throw error
  return data ?? []
}

export async function insertHabit(
  userId: string,
  h: { emoji: string; title: string; meta: string; position: number }
): Promise<DBHabit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...h, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function addCompletion(userId: string, habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .upsert({ user_id: userId, habit_id: habitId, date }, { onConflict: 'habit_id,date', ignoreDuplicates: true })
  if (error) throw error
}

export async function removeCompletion(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
  if (error) throw error
}
