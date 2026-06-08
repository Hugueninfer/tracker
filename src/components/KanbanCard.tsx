import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Paperclip, Image as ImageIcon } from 'lucide-react'
import type { KanbanCard as TCard } from '@/lib/types'
import { useKanbanStore } from '@/store/kanbanStore'
import { labelTintClass } from '@/components/labelStyles'
import { cx } from '@/lib/utils'

export function KanbanCard({ card, columnId }: { card: TCard; columnId: string }) {
  const openCard = useKanbanStore((s) => s.openCard)
  const down = useRef<{ x: number; y: number } | null>(null)
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', columnId } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  // only open drawer on a real click (pointer barely moved), not after a drag
  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY }
  }
  const onClick = (e: React.MouseEvent) => {
    if (!down.current) return openCard(card.id)
    const moved =
      Math.abs(e.clientX - down.current.x) + Math.abs(e.clientY - down.current.y)
    if (moved < 6) openCard(card.id)
  }

  const cover = card.images[0]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDownCapture={onPointerDown}
      onClick={onClick}
      className={cx(
        'bg-card rounded-card shadow-card p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-cardHover',
        isDragging && 'opacity-50'
      )}
    >
      {cover && (
        <img
          src={cover.dataUrl}
          alt={cover.name}
          className="w-full h-28 object-cover rounded-badge mb-2.5"
        />
      )}

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((l) => (
            <span key={l.id} className={cx('text-micro font-semibold px-2 py-0.5 rounded-pill', labelTintClass[l.tint])}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-item font-semibold leading-snug">{card.title}</p>

      {(card.images.length > 0 || card.dueDate) && (
        <div className="flex items-center gap-3 mt-2 text-micro text-muted">
          {card.images.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon size={12} /> {card.images.length}
            </span>
          )}
          {card.dueDate && (
            <span className="flex items-center gap-1">
              <Paperclip size={12} /> {card.dueDate}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
