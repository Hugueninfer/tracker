// Shared domain types

export type ViewKey = 'habits' | 'kanban' | 'expenses'

// ---- Habit Tracker ----
export interface Habit {
  id: string
  emoji: string
  title: string
  meta: string // e.g. "08:30am · Home"
  doneToday: boolean
  streak: number
  // ISO date strings the habit was completed on (for calendar dots)
  completedDates: string[]
}

// ---- Kanban ----
export interface CardImage {
  id: string
  storagePath: string
  dataUrl: string // signed URL for display
  name: string
}

export interface KanbanCard {
  id: string
  title: string
  description: string // rich text HTML
  notes: string // rich text HTML
  images: CardImage[]
  labels: Label[]
  dueDate?: string // ISO
}

export interface Label {
  id: string
  name: string
  tint: LabelTint
}

export type LabelTint = 'yellow' | 'coral' | 'sage' | 'cream' | 'accent'

export interface Column {
  id: string
  title: string
  cardIds: string[]
}

// alias used by the kanban store when reading jsonb labels
export type DBLabel = Label

// ---- Expenses module ----
export type Tint = LabelTint

export interface PaymentCard {
  id: string
  name: string
  tint: Tint
}

export interface ExpenseCategory {
  id: string
  name: string
  tint: Tint
}

export interface Income {
  id: string
  month: string // YYYY-MM
  name: string
  amount: number
}

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  month: string // YYYY-MM
  name: string
  categoryId: string | null
  cardId: string | null
  amount: number
  installmentGroup: string | null
  installmentIndex: number
  installmentCount: number
}
