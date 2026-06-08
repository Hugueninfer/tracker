import { useEffect } from 'react'
import { X, Trash2, Tag, Calendar as CalIcon } from 'lucide-react'
import { useKanbanStore } from '@/store/kanbanStore'
import { RichTextEditor } from '@/components/RichTextEditor'
import { ImageUpload } from '@/components/ImageUpload'
import { Button } from '@/components/Button'
import { labelTintClass, LABEL_TINTS } from '@/components/labelStyles'
import { uid, cx } from '@/lib/utils'

export function CardDrawer() {
  const openCardId = useKanbanStore((s) => s.openCardId)
  const card = useKanbanStore((s) => (openCardId ? s.cards[openCardId] : null))
  const close = useKanbanStore((s) => s.openCard)
  const updateCard = useKanbanStore((s) => s.updateCard)
  const removeCard = useKanbanStore((s) => s.removeCard)
  const addImage = useKanbanStore((s) => s.addImage)
  const removeImage = useKanbanStore((s) => s.removeImage)
  const addLabel = useKanbanStore((s) => s.addLabel)
  const removeLabel = useKanbanStore((s) => s.removeLabel)

  const open = !!card

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(null)
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      {/* scrim — click outside closes */}
      <div
        onClick={() => close(null)}
        className={cx(
          'fixed inset-0 bg-tint-ink/20 backdrop-blur-[1px] transition-opacity duration-300 z-40',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* drawer — rendered as a card: rounded, soft shadow, generous padding */}
      <aside
        className={cx(
          'fixed top-0 right-0 h-full w-full max-w-md z-50 p-4 transition-transform duration-300 ease-soft',
          open ? 'translate-x-0' : 'translate-x-[110%]'
        )}
      >
        {card && (
          <div className="h-full bg-card rounded-card shadow-drawer p-6 flex flex-col gap-5 overflow-y-auto">
            {/* header */}
            <div className="flex items-start justify-between gap-3">
              <input
                value={card.title}
                onChange={(e) => updateCard(card.id, { title: e.target.value })}
                placeholder="Título do card…"
                className="flex-1 text-pageTitle font-extrabold bg-transparent outline-none placeholder:text-muted"
              />
              <button onClick={() => close(null)} className="h-9 w-9 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted shrink-0" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {/* labels */}
            <section>
              <div className="flex items-center gap-2 text-meta text-muted mb-2">
                <Tag size={14} /> Etiquetas
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {card.labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => removeLabel(card.id, l.id)}
                    className={cx('text-micro font-semibold px-2.5 py-1 rounded-pill flex items-center gap-1', labelTintClass[l.tint])}
                    title="Clique para remover"
                  >
                    {l.name} <X size={11} />
                  </button>
                ))}
                {/* quick add by tint */}
                {LABEL_TINTS.map((tint) => (
                  <button
                    key={tint}
                    onClick={() => {
                      const name = window.prompt('Nome da etiqueta', tint)
                      if (name) addLabel(card.id, { id: uid(), name, tint })
                    }}
                    className={cx('h-6 w-6 rounded-full border border-hairline', labelTintClass[tint])}
                    aria-label={`Adicionar etiqueta ${tint}`}
                  />
                ))}
              </div>
            </section>

            {/* due date */}
            <section>
              <div className="flex items-center gap-2 text-meta text-muted mb-2">
                <CalIcon size={14} /> Data
              </div>
              <input
                type="date"
                value={card.dueDate ?? ''}
                onChange={(e) => updateCard(card.id, { dueDate: e.target.value || undefined })}
                className="bg-cardAlt rounded-pill px-4 h-10 text-item outline-none focus:ring-2 focus:ring-accent"
              />
            </section>

            {/* description */}
            <section>
              <h3 className="text-item font-semibold mb-2">Descrição</h3>
              <RichTextEditor
                value={card.description}
                onChange={(html) => updateCard(card.id, { description: html })}
                placeholder="Adicione uma descrição detalhada…"
              />
            </section>

            {/* images */}
            <section>
              <h3 className="text-item font-semibold mb-2">Anexos</h3>
              <ImageUpload
                images={card.images}
                onAdd={(file) => addImage(card.id, file)}
                onRemove={(id) => removeImage(card.id, id)}
              />
            </section>

            {/* notes */}
            <section>
              <h3 className="text-item font-semibold mb-2">Notas</h3>
              <RichTextEditor
                value={card.notes}
                onChange={(html) => updateCard(card.id, { notes: html })}
                placeholder="Comentários, ideias…"
              />
            </section>

            {/* footer */}
            <div className="mt-auto pt-2">
              <Button
                variant="secondary"
                className="text-tint-coral border-tint-coral/30"
                onClick={() => removeCard(card.id)}
              >
                <Trash2 size={16} /> Excluir card
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
