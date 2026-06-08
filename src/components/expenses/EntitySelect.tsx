import { useState } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { colorById } from '@/lib/expenseColors'
import { cx } from '@/lib/utils'

export interface SelectOption {
  id: string
  name: string
  tint: string
}

interface Props {
  value: string | null
  options: SelectOption[]
  placeholder: string
  emptyLabel: string // e.g. "Sem categoria"
  newLabel: string // e.g. "Nova categoria"
  onChange: (id: string | null) => void
  onCreateNew: () => void
}

function Chip({ name, tint }: { name: string; tint: string }) {
  const c = colorById(tint)
  return (
    <span className="text-micro font-semibold px-2.5 py-1 rounded-pill truncate max-w-full" style={{ backgroundColor: c.bg, color: c.fg }}>
      {name}
    </span>
  )
}

export function EntitySelect({ value, options, placeholder, emptyLabel, newLabel, onChange, onCreateNew }: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value) ?? null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-1 bg-cardAlt rounded-pill pl-2 pr-2 h-9 text-item outline-none hover:bg-accent-tint transition-colors"
      >
        {selected ? <Chip name={selected.name} tint={selected.tint} /> : <span className="text-muted text-meta pl-1 truncate">{placeholder}</span>}
        <ChevronDown size={14} className="text-muted shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-56 max-h-64 overflow-y-auto bg-card rounded-card shadow-cardHover p-1.5">
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={cx('w-full flex items-center justify-between px-2.5 py-2 rounded-badge text-item hover:bg-accent-tint', !value && 'bg-accent-tint')}
            >
              <span className="text-muted text-meta">{emptyLabel}</span>
              {!value && <Check size={14} className="text-accent" />}
            </button>
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => { onChange(o.id); setOpen(false) }}
                className={cx('w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-badge hover:bg-accent-tint', value === o.id && 'bg-accent-tint')}
              >
                <Chip name={o.name} tint={o.tint} />
                {value === o.id && <Check size={14} className="text-accent shrink-0" />}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); onCreateNew() }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-badge text-item text-accent font-semibold hover:bg-accent-tint border-t border-hairline mt-1"
            >
              <Plus size={15} /> {newLabel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
