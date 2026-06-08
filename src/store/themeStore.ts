import { create } from 'zustand'

type Theme = 'light' | 'dark'

const KEY = 'tracker.theme'

function initial(): Theme {
  const saved = localStorage.getItem(KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const theme = initial()
  apply(theme)
  return {
    theme,
    toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    setTheme: (t) => {
      localStorage.setItem(KEY, t)
      apply(t)
      set({ theme: t })
    },
  }
})
