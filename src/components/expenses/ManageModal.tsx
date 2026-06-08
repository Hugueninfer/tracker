import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useExpensesStore } from '@/store/expensesStore'
import { labelTintClass, LABEL_TINTS } from '@/components/labelStyles'
import type { Tint } from '@/lib/types'
import { cx } from '@/lib/utils'

export function ManageModal({ onClose }: { onClose: () => void }) {
  const cards = useExpensesStore((s) => s.cards)
  const categories = useExpensesStore((s) => s.categories)
  const addCard = useExpensesStore((s) => s.addCard)
  const renameCard = useExpensesStore((s) => s.renameCard)
  const setCardTint = useExpensesStore((s) => s.setCardTint)
  const removeCard = useExpensesStore((s) => s.removeCard)
  const addCategory = useExpensesStore((s) => s.addCategory)
  const renameCategory = useExpensesStore((s) => s.renameCategory)
  const setCategoryTint = useExpensesStore((s) => s.setCategoryTint)
  const removeCategory = useExpensesStore((s) => s.removeCategory)

  const [newCard, setNewCard] = useState('')
  const [newCat, setNewCat] = useState('')

  const TintPicker = ({ value, onPick }: { value: Tint; onPick: (t: Tint) => void }) => (
    <div className="flex gap-1">
      {LABEL_TINTS.map((t) => (
        <button key={t} onClick={() => onPick(t)} className={cx('h-5 w-5 rounded-full', labelTintClass[t], value === t && 'ring-2 ring-ink')} aria-label={`Cor ${t}`} />
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-tint-ink/30 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-lg bg-card rounded-card shadow-drawer p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-cardTitle font-bold">Gerenciar cartões e categorias</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted" aria-label="Fechar"><X size={18} /></button>
        </div>

        {/* cards */}
        <section>
          <h3 className="text-item font-semibold mb-2">Cartões</h3>
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-cardAlt rounded-badge px-3 py-2">
                <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && renameCard(c.id, e.target.value)} className="bg-transparent outline-none text-item flex-1" />
                <TintPicker value={c.tint} onPick={(t) => setCardTint(c.id, t)} />
                <button onClick={() => removeCard(c.id)} className="text-muted hover:text-tint-coral" aria-label="Excluir cartão"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={newCard} onChange={(e) => setNewCard(e.target.value)} placeholder="Novo cartão" className="flex-1 bg-cardAlt rounded-pill px-4 h-10 text-item outline-none" />
            <button onClick={() => { if (newCard.trim()) { addCard(newCard.trim(), 'accent'); setNewCard('') } }} className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center" aria-label="Adicionar cartão"><Plus size={18} /></button>
          </div>
        </section>

        {/* categories */}
        <section>
          <h3 className="text-item font-semibold mb-2">Categorias</h3>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-cardAlt rounded-badge px-3 py-2">
                <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && renameCategory(c.id, e.target.value)} className="bg-transparent outline-none text-item flex-1" />
                <TintPicker value={c.tint} onPick={(t) => setCategoryTint(c.id, t)} />
                <button onClick={() => removeCategory(c.id)} className="text-muted hover:text-tint-coral" aria-label="Excluir categoria"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nova categoria" className="flex-1 bg-cardAlt rounded-pill px-4 h-10 text-item outline-none" />
            <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim(), 'sage'); setNewCat('') } }} className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center" aria-label="Adicionar categoria"><Plus size={18} /></button>
          </div>
        </section>
      </div>
    </div>
  )
}
