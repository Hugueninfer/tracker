import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { HabitTracker } from '@/views/HabitTracker'
import { Kanban } from '@/views/Kanban'
import { Auth } from '@/views/Auth'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const view = useUIStore((s) => s.view)
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted">Carregando…</div>
  }
  if (!session) {
    return (
      <div className="h-full p-2 sm:p-4">
        <div className="h-full rounded-outer bg-page shadow-card overflow-hidden">
          <Auth />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-4">
      <div className="h-full rounded-outer bg-page shadow-card flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto px-3 sm:px-6 pb-6">
            {view === 'habits' ? <HabitTracker /> : <Kanban />}
          </main>
        </div>
      </div>
    </div>
  )
}
