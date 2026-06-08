import { create } from 'zustand'
import type { ViewKey } from '@/lib/types'

interface UIState {
  view: ViewKey
  sidebarOpen: boolean // mobile off-canvas sidebar
  setView: (v: ViewKey) => void
  setSidebar: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  view: 'habits',
  sidebarOpen: false,
  setView: (v) => set({ view: v, sidebarOpen: false }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
