import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { HabitTracker } from '@/views/HabitTracker'
import { Kanban } from '@/views/Kanban'
import { useUIStore } from '@/store/uiStore'

export default function App() {
  const view = useUIStore((s) => s.view)

  return (
    <div className="h-full p-2 sm:p-4">
      {/* outer frame — rounded floating window on warm-gray canvas */}
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
