import { create } from 'zustand'
import type { Habit } from '@/lib/types'
import { todayISO, uid } from '@/lib/utils'
import { computeStreak, isDoneToday } from '@/lib/streak'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api/habits'

interface HabitState {
  habits: Habit[]
  selectedDate: string
  loaded: boolean
  load: () => Promise<void>
  addHabit: (h: { emoji: string; title: string; meta: string }) => Promise<void>
  toggleHabit: (id: string) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  setSelectedDate: (iso: string) => void
  reset: () => void
}

function build(dbHabits: { id: string; emoji: string; title: string; meta: string; position: number }[],
  completionsByHabit: Map<string, string[]>): Habit[] {
  return dbHabits.map((h) => {
    const dates = completionsByHabit.get(h.id) ?? []
    return {
      id: h.id,
      emoji: h.emoji,
      title: h.title,
      meta: h.meta,
      completedDates: dates,
      doneToday: isDoneToday(dates),
      streak: computeStreak(dates),
    }
  })
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  selectedDate: todayISO(),
  loaded: false,
  load: async () => {
    const [dbHabits, completions] = await Promise.all([api.listHabits(), api.listCompletions()])
    const map = new Map<string, string[]>()
    for (const c of completions) {
      const arr = map.get(c.habit_id) ?? []
      arr.push(c.date)
      map.set(c.habit_id, arr)
    }
    set({ habits: build(dbHabits, map), loaded: true })
  },
  addHabit: async (h) => {
    const userId = useAuthStore.getState().user!.id
    const position = get().habits.length
    const optimistic: Habit = {
      id: uid(), emoji: h.emoji, title: h.title, meta: h.meta,
      completedDates: [], doneToday: false, streak: 0,
    }
    set((s) => ({ habits: [...s.habits, optimistic] }))
    try {
      const row = await api.insertHabit(userId, { ...h, position })
      set((s) => ({ habits: s.habits.map((x) => (x.id === optimistic.id ? { ...x, id: row.id } : x)) }))
    } catch {
      set((s) => ({ habits: s.habits.filter((x) => x.id !== optimistic.id) }))
    }
  },
  toggleHabit: async (id) => {
    const userId = useAuthStore.getState().user!.id
    const t = todayISO()
    const prev = get().habits
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h.id !== id) return h
        const now = !h.doneToday
        const dates = now
          ? Array.from(new Set([...h.completedDates, t]))
          : h.completedDates.filter((d) => d !== t)
        return { ...h, completedDates: dates, doneToday: now, streak: computeStreak(dates) }
      }),
    }))
    try {
      const wasDone = prev.find((h) => h.id === id)?.doneToday
      if (wasDone) await api.removeCompletion(id, t)
      else await api.addCompletion(userId, id, t)
    } catch {
      set({ habits: prev })
    }
  },
  removeHabit: async (id) => {
    const prev = get().habits
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    try { await api.deleteHabit(id) } catch { set({ habits: prev }) }
  },
  setSelectedDate: (iso) => set({ selectedDate: iso }),
  reset: () => set({ habits: [], loaded: false }),
}))
