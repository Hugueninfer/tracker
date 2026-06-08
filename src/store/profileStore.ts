import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  name: string
  email: string
  setName: (n: string) => void
  setEmail: (e: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: 'Pedro',
      email: 'hugueninpedro@gmail.com',
      setName: (name) => set({ name }),
      setEmail: (email) => set({ email }),
    }),
    { name: 'tracker.profile' }
  )
)

export function logout() {
  // no backend — clear local data and reload to a fresh session
  ;['tracker.profile', 'tracker.habits.v3', 'tracker.kanban.v2', 'tracker.theme'].forEach((k) =>
    localStorage.removeItem(k)
  )
  location.reload()
}
