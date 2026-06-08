import { supabase } from '@/lib/supabase'
import type { DBProfile } from '@/lib/db-types'

export async function getProfile(): Promise<DBProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').single()
  if (error) return null
  return data
}

export async function updateProfile(patch: Partial<Pick<DBProfile, 'name' | 'email'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', (await supabase.auth.getUser()).data.user!.id)
  if (error) throw error
}
