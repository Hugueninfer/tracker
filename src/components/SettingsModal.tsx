import { X, Sun, Moon, Trash2 } from 'lucide-react'
import { useProfileStore, logout } from '@/store/profileStore'
import { useThemeStore } from '@/store/themeStore'
import { cx } from '@/lib/utils'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { name, email, setName, setEmail, save } = useProfileStore()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* scrim */}
      <div onClick={onClose} className="absolute inset-0 bg-tint-ink/30 backdrop-blur-[1px]" />

      <div className="relative w-full max-w-md bg-card rounded-card shadow-drawer p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-cardTitle font-bold">Configurações</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* profile fields */}
        <section className="flex flex-col gap-3">
          <label className="text-meta text-muted">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => save()}
            className="bg-cardAlt rounded-pill px-4 h-11 text-item outline-none focus:ring-2 focus:ring-accent"
          />
          <label className="text-meta text-muted">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => save()}
            className="bg-cardAlt rounded-pill px-4 h-11 text-item outline-none focus:ring-2 focus:ring-accent"
          />
        </section>

        {/* theme */}
        <section>
          <p className="text-meta text-muted mb-2">Tema</p>
          <div className="flex bg-cardAlt rounded-pill p-1 w-fit">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cx(
                  'flex items-center gap-2 px-4 h-9 rounded-pill text-meta font-semibold transition-colors',
                  theme === t ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                )}
              >
                {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                {t === 'light' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
        </section>

        {/* danger */}
        <section className="pt-2 border-t border-hairline">
          <button
            onClick={() => {
              if (confirm('Apagar todos os dados locais e sair?')) logout()
            }}
            className="flex items-center gap-2 text-meta text-tint-coral hover:underline"
          >
            <Trash2 size={14} /> Apagar dados e sair
          </button>
        </section>
      </div>
    </div>
  )
}
