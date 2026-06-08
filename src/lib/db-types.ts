import type { LabelTint, Tint } from './types'

export interface DBHabit {
  id: string
  user_id: string
  emoji: string
  title: string
  meta: string
  position: number
  created_at: string
}

export interface DBCompletion {
  id: string
  user_id: string
  habit_id: string
  date: string // yyyy-mm-dd
}

export interface DBColumn {
  id: string
  user_id: string
  title: string
  position: number
}

export interface DBLabel {
  id: string
  name: string
  tint: LabelTint
}

export interface DBCard {
  id: string
  user_id: string
  column_id: string
  title: string
  description: string
  notes: string
  due_date: string | null
  labels: DBLabel[]
  position: number
}

export interface DBCardImage {
  id: string
  user_id: string
  card_id: string
  storage_path: string
  name: string
  position: number
}

export interface DBProfile {
  id: string
  name: string
  email: string
}

export interface DBPaymentCard {
  id: string
  user_id: string
  name: string
  tint: Tint
  position: number
}

export interface DBExpenseCategory {
  id: string
  user_id: string
  name: string
  tint: Tint
  position: number
}

export interface DBIncome {
  id: string
  user_id: string
  month: string
  name: string
  amount: number
}

export interface DBExpense {
  id: string
  user_id: string
  date: string
  month: string
  name: string
  category_id: string | null
  card_id: string | null
  amount: number
  installment_group: string | null
  installment_index: number
  installment_count: number
  position: number
}
