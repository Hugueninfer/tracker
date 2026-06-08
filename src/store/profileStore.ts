import { create } from 'zustand'
import * as api from '@/lib/api/profile'
import { useAuthStore } from '@/store/authStore'

interface ProfileState {
  name: string
  email: string
  load: () => Promise<void>
  setName: (n: string) => void
  setEmail: (e: string) => void
  save: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  name: '',
  email: '',
  load: async () => {
    const p = await api.getProfile()
    if (p) set({ name: p.name, email: p.email })
  },
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  save: async () => {
    await api.updateProfile({ name: get().name, email: get().email })
  },
}))

export async function logout() {
  await useAuthStore.getState().signOut()
  location.reload()
}
