import { supabase } from '@/lib/supabase'
import type { DBColumn, DBCard, DBCardImage } from '@/lib/db-types'

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
export async function listCardImages(): Promise<DBCardImage[]> {
  const { data, error } = await supabase.from('card_images').select('*').order('position')
  if (error) throw error
  return data ?? []
}
export async function uploadCardImage(
  userId: string, cardId: string, file: File
): Promise<DBCardImage> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/${cardId}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from('card-images').upload(path, file)
  if (up.error) throw up.error
  const { data, error } = await supabase.from('card_images')
    .insert({ user_id: userId, card_id: cardId, storage_path: path, name: file.name, position: 0 })
    .select().single()
  if (error) throw error
  return data
}
export async function deleteCardImage(img: { id: string; storage_path: string }): Promise<void> {
  await supabase.storage.from('card-images').remove([img.storage_path])
  const { error } = await supabase.from('card_images').delete().eq('id', img.id)
  if (error) throw error
}
export async function signedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('card-images').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
export async function deleteCardImagesByCard(cardId: string): Promise<void> {
  const { data } = await supabase.from('card_images').select('storage_path').eq('card_id', cardId)
  const paths = (data ?? []).map((r) => r.storage_path)
  if (paths.length) await supabase.storage.from('card-images').remove(paths)
}
