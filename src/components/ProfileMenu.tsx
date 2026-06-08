import { useState } from 'react'
import { Settings, LogOut, ChevronUp } from 'lucide-react'
import { useProfileStore, logout } from '@/store/profileStore'
import { SettingsModal } from '@/components/SettingsModal'
import { cx } from '@/lib/utils'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'
}

export function ProfileMenu() {
  const name = useProfileStore((s) => s.name)
  const email = useProfileStore((s) => s.email)
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(false)

  return (
    <div className="relative">
      {/* dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-20 bg-card rounded-card shadow-cardHover p-1.5">
            <button
              onClick={() => { setSettings(true); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-badge text-item hover:bg-accent-tint transition-colors"
            >
              <Settings size={16} /> Configurações
            </button>
            <button
              onClick={() => { if (confirm('Sair da conta?')) logout() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-badge text-item text-tint-coral hover:bg-accent-tint transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </>
      )}

      {/* profile button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'w-full flex items-center gap-3 px-2 py-2 rounded-card transition-colors',
          open ? 'bg-accent-tint' : 'hover:bg-accent-tint'
        )}
      >
        <span className="h-9 w-9 shrink-0 rounded-full bg-accent text-white font-bold text-meta flex items-center justify-center">
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-item font-semibold truncate">{name}</span>
          <span className="block text-micro text-muted truncate">{email}</span>
        </span>
        <ChevronUp size={16} className={cx('text-muted transition-transform', !open && 'rotate-180')} />
      </button>

      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  )
}
