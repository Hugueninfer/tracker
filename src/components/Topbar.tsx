import { Search, Sun, Moon, Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useThemeStore } from '@/store/themeStore'

const crumb: Record<string, string> = {
  habits: 'Hábitos',
  kanban: 'Kanban',
}

/** Light chrome header: breadcrumb + search (no macOS dots per request). */
export function Topbar() {
  const view = useUIStore((s) => s.view)
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
      <div className="flex items-center gap-2 min-w-0">
        {/* hamburger — mobile only */}
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="lg:hidden h-10 w-10 shrink-0 rounded-full bg-card shadow-card flex items-center justify-center text-muted"
        >
          <Menu size={18} />
        </button>
        <div className="text-meta text-muted truncate">
          <span className="font-semibold text-ink hidden sm:inline">Área de trabalho</span>
          <span className="mx-2 hidden sm:inline">/</span>
          <span>{crumb[view]}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 bg-card rounded-pill px-4 py-2 shadow-card w-40 sm:w-56 lg:w-72">
          <Search size={16} className="text-muted shrink-0" />
          <input
            placeholder="Buscar…"
            className="bg-transparent outline-none text-item w-full placeholder:text-muted"
          />
        </div>
        <button
          onClick={toggle}
          aria-label="Alternar modo escuro"
          className="h-10 w-10 rounded-full bg-card shadow-card flex items-center justify-center text-muted hover:text-accent hover:scale-105 transition-all duration-200 ease-soft"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
