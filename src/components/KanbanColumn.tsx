import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Trash2, GripVertical } from 'lucide-react'
import type { Column, KanbanCard as TCard } from '@/lib/types'
import { useKanbanStore } from '@/store/kanbanStore'
import { KanbanCard } from '@/components/KanbanCard'
import { cx } from '@/lib/utils'

export function KanbanColumn({ column, cards }: { column: Column; cards: TCard[] }) {
  const addCard = useKanbanStore((s) => s.addCard)
  const removeColumn = useKanbanStore((s) => s.removeColumn)
  const renameColumn = useKanbanStore((s) => s.renameColumn)

  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(column.title)

  // column itself sortable (reorder columns)
  const {
    attributes, listeners, setNodeRef: setColRef, transform, transition, isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', columnId: column.id } })

  // droppable body so empty columns still accept cards
  const { setNodeRef: setDropRef } = useDroppable({
    id: `col-drop-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const style = { transform: CSS.Translate.toString(transform), transition }

  return (
    <div
      ref={setColRef}
      style={style}
      className={cx('w-72 shrink-0 flex flex-col', isDragging && 'opacity-60')}
    >
      {/* header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted hover:text-ink" aria-label="Arrastar coluna">
          <GripVertical size={16} />
        </button>

        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { renameColumn(column.id, name.trim() || column.title); setEditing(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { renameColumn(column.id, name.trim() || column.title); setEditing(false) }
            }}
            className="flex-1 bg-card rounded-pill px-3 h-8 text-item font-bold outline-none focus:ring-2 focus:ring-accent"
          />
        ) : (
          <h2
            onDoubleClick={() => setEditing(true)}
            className="flex-1 text-cardTitle font-bold truncate"
            title="Clique duplo para renomear"
          >
            {column.title}
          </h2>
        )}

        <span className="text-meta text-muted">{cards.length}</span>

        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} className="text-muted hover:text-ink h-7 w-7 rounded-full hover:bg-accent-tint flex items-center justify-center" aria-label="Menu da coluna">
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 top-8 z-10 bg-card rounded-card shadow-cardHover p-1 w-36" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setEditing(true); setMenu(false) }} className="w-full text-left px-3 py-2 rounded-badge text-item hover:bg-accent-tint">
                Renomear
              </button>
              <button onClick={() => removeColumn(column.id)} className="w-full text-left px-3 py-2 rounded-badge text-item text-tint-coral hover:bg-accent-tint flex items-center gap-2">
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* card list */}
      <div ref={setDropRef} className="flex flex-col gap-2.5 min-h-[60px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} columnId={column.id} />
          ))}
        </SortableContext>
      </div>

      {/* add card */}
      <button
        onClick={() => addCard(column.id, 'Novo card')}
        className="mt-2.5 flex items-center gap-2 px-3 py-2.5 rounded-card text-item font-medium text-muted hover:bg-accent-tint hover:text-ink transition-colors"
      >
        <Plus size={16} /> Adicionar card
      </button>
    </div>
  )
}
