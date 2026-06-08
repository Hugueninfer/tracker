import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { EXPENSE_COLORS, colorById } from '@/lib/expenseColors'
import { cx } from '@/lib/utils'

interface Props {
  title: string
  placeholder: string
  defaultColor?: string
  onCreate: (name: string, colorId: string) => void
  onClose: () => void
}

export function CreateEntityModal({ title, placeholder, defaultColor, onCreate, onClose }: Props) {
  const [name, setName] = useState('')
  const [colorId, setColorId] = useState(defaultColor ?? EXPENSE_COLORS[0].id)

  const create = () => {
    if (!name.trim()) return
    onCreate(name.trim(), colorId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-tint-ink/30 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-sm bg-card rounded-card shadow-drawer p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-cardTitle font-bold">{title}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder={placeholder}
          className="bg-cardAlt rounded-pill px-4 h-11 text-item outline-none focus:ring-2 focus:ring-accent"
        />

        <div>
          <p className="text-meta text-muted mb-2">Cor</p>
          <div className="grid grid-cols-5 gap-2.5">
            {EXPENSE_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColorId(c.id)}
                title={c.label}
                style={{ backgroundColor: c.bg, color: c.fg }}
                className={cx(
                  'h-10 rounded-badge flex items-center justify-center transition-transform',
                  colorId === c.id ? 'ring-2 ring-ink scale-105' : 'hover:scale-105'
                )}
                aria-label={c.label}
              >
                {colorId === c.id && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* preview */}
        <div className="flex items-center gap-2">
          <span className="text-meta text-muted">Prévia:</span>
          <span
            className="text-micro font-semibold px-2.5 py-1 rounded-pill"
            style={{ backgroundColor: colorById(colorId).bg, color: colorById(colorId).fg }}
          >
            {name.trim() || placeholder}
          </span>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-pill px-4 h-10 text-item font-semibold text-muted hover:bg-accent-tint">Cancelar</button>
          <button onClick={create} className="rounded-pill px-5 h-10 text-item font-semibold bg-accent text-white hover:scale-[1.02] transition-transform">Criar</button>
        </div>
      </div>
    </div>
  )
}
