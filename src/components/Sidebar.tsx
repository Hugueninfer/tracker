import { LayoutGrid, CalendarCheck, Wallet } from 'lucide-react'
import type { ViewKey } from '@/lib/types'
import { useUIStore } from '@/store/uiStore'
import { ProfileMenu } from '@/components/ProfileMenu'
import { cx } from '@/lib/utils'

const items: { key: ViewKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'habits', label: 'Hábitos', icon: CalendarCheck },
  { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { key: 'expenses', label: 'Gastos', icon: Wallet },
]

export function Sidebar() {
  const view = useUIStore((s) => s.view)
  const setView = useUIStore((s) => s.setView)
  const open = useUIStore((s) => s.sidebarOpen)
  const setSidebar = useUIStore((s) => s.setSidebar)

  return (
    <>
      {/* backdrop (mobile only) */}
      <div
        onClick={() => setSidebar(false)}
        className={cx(
          'fixed inset-0 z-30 bg-tint-ink/30 backdrop-blur-[1px] lg:hidden transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <aside
        className={cx(
          'w-64 shrink-0 p-5 flex flex-col gap-8 bg-page',
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-soft',
          'lg:static lg:translate-x-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      {/* brand */}
      <div className="flex items-center gap-2 px-2 pt-2">
        <span className="text-2xl">🌱</span>
        <span className="text-lg font-extrabold tracking-tight">Tracker</span>
      </div>

      {/* nav — exactly 2 items */}
      <nav className="flex flex-col gap-2">
        {items.map(({ key, label, icon: Icon }) => {
          const active = view === key
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cx(
                'flex items-center gap-3 px-4 py-3 rounded-pill text-item font-semibold transition-all duration-200 ease-soft',
                active
                  ? 'bg-accent text-white shadow-card scale-[1.02]'
                  : 'text-muted hover:bg-accent-tint hover:text-ink'
              )}
            >
              <Icon size={18} strokeWidth={2.2} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto">
        <ProfileMenu />
      </div>
      </aside>
    </>
  )
}
