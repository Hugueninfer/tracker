import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit } from '@/lib/types'
import { uid, todayISO } from '@/lib/utils'

interface HabitState {
  habits: Habit[]
  selectedDate: string // ISO yyyy-mm-dd
  addHabit: (h: Omit<Habit, 'id' | 'doneToday' | 'streak' | 'completedDates'>) => void
  toggleHabit: (id: string) => void
  removeHabit: (id: string) => void
  setSelectedDate: (iso: string) => void
}

// Generate plausible past completions over the last `days` at ~`rate` density.
// Deterministic per seed so the heatmap looks stable across reloads.
function history(days: number, rate: number, seed: number): string[] {
  const out: string[] = []
  let s = seed
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const now = new Date()
  for (let i = 0; i < days; i++) {
    if (rnd() < rate) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      out.push(d.toISOString().slice(0, 10))
    }
  }
  return out
}

const seed: Habit[] = [
  {
    id: uid(),
    emoji: '📚',
    title: 'Estudar',
    meta: '10:00 · Cafeteria',
    doneToday: false,
    streak: 4,
    completedDates: history(300, 0.55, 7),
  },
  {
    id: uid(),
    emoji: '🛒',
    title: 'Compras',
    meta: '14:00 · Mercado',
    doneToday: false,
    streak: 2,
    completedDates: history(300, 0.3, 19),
  },
  {
    id: uid(),
    emoji: '🥦',
    title: 'Comer saudável',
    meta: '08:30 · Casa',
    doneToday: true,
    streak: 12,
    completedDates: Array.from(new Set([todayISO(), ...history(300, 0.8, 23)])),
  },
  {
    id: uid(),
    emoji: '📖',
    title: 'Ler um livro',
    meta: '08:00 · Biblioteca',
    doneToday: true,
    streak: 7,
    completedDates: Array.from(new Set([todayISO(), ...history(300, 0.65, 41)])),
  },
  {
    id: uid(),
    emoji: '🏊',
    title: 'Natação 45min',
    meta: '06:00 · Piscina',
    doneToday: true,
    streak: 9,
    completedDates: Array.from(new Set([todayISO(), ...history(300, 0.45, 57)])),
  },
]

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: seed,
      selectedDate: todayISO(),
      addHabit: (h) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { ...h, id: uid(), doneToday: false, streak: 0, completedDates: [] },
          ],
        })),
      toggleHabit: (id) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const now = !h.doneToday
            const t = todayISO()
            return {
              ...h,
              doneToday: now,
              streak: now ? h.streak + 1 : Math.max(0, h.streak - 1),
              completedDates: now
                ? Array.from(new Set([...h.completedDates, t]))
                : h.completedDates.filter((d) => d !== t),
            }
          }),
        })),
      removeHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      setSelectedDate: (iso) => set({ selectedDate: iso }),
    }),
    { name: 'tracker.habits.v3' }
  )
)
