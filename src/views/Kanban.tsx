import { useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useKanbanStore } from '@/store/kanbanStore'
import * as kanbanApi from '@/lib/api/kanban'
import { KanbanColumn } from '@/components/KanbanColumn'
import { CardDrawer } from '@/components/CardDrawer'

export function Kanban() {
  const columns = useKanbanStore((s) => s.columns)
  const cards = useKanbanStore((s) => s.cards)
  const setColumns = useKanbanStore((s) => s.setColumns)
  const persistColumnOrder = useKanbanStore((s) => s.persistColumnOrder)
  const moveCard = useKanbanStore((s) => s.moveCard)
  const addColumn = useKanbanStore((s) => s.addColumn)

  const [addingCol, setAddingCol] = useState(false)
  const [colName, setColName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const aType = active.data.current?.type
    // columnId under the pointer — works for cards, column body, or column container
    const toCol = over.data.current?.columnId as string | undefined
    const oType = over.data.current?.type

    // ---- reorder columns ----
    if (aType === 'column') {
      if (toCol && toCol !== active.id) {
        const oldI = columns.findIndex((c) => c.id === active.id)
        const newI = columns.findIndex((c) => c.id === toCol)
        if (oldI >= 0 && newI >= 0) persistColumnOrder(arrayMove(columns, oldI, newI))
      }
      return
    }

    // ---- move card ----
    const fromCol = active.data.current?.columnId as string | undefined
    if (!fromCol || !toCol) return
    const target = columns.find((c) => c.id === toCol)
    if (!target) return

    // target index: above the card hovered, else end of column
    const toIndex =
      oType === 'card' ? target.cardIds.indexOf(over.id as string) : target.cardIds.length

    // same-column reorder -> arrayMove for accuracy
    if (fromCol === toCol) {
      if (oType !== 'card') return
      const oldI = target.cardIds.indexOf(active.id as string)
      const newI = target.cardIds.indexOf(over.id as string)
      if (oldI !== newI && oldI >= 0 && newI >= 0) {
        const reordered = columns.map((c) =>
          c.id === toCol ? { ...c, cardIds: arrayMove(c.cardIds, oldI, newI) } : c
        )
        setColumns(reordered)
        const tgt = reordered.find((c) => c.id === toCol)!
        void Promise.all(tgt.cardIds.map((cid, i) => kanbanApi.updateCard(cid, { position: i })))
      }
      return
    }

    moveCard(active.id as string, fromCol, toCol, toIndex)
  }

  const submitCol = () => {
    if (colName.trim()) addColumn(colName.trim())
    setColName('')
    setAddingCol(false)
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-pageTitle font-extrabold mb-1">Kanban</h1>
      <p className="text-meta text-muted mb-5">Arraste cards e colunas · clique num card para editar</p>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="board-scroll flex gap-5 overflow-x-auto pb-4 items-start">
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                cards={col.cardIds.map((id) => cards[id]).filter(Boolean)}
              />
            ))}
          </SortableContext>

          {/* add column */}
          <div className="w-72 shrink-0">
            {addingCol ? (
              <div className="bg-card rounded-card shadow-card p-3 flex flex-col gap-2">
                <input
                  autoFocus
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitCol()}
                  placeholder="Nome da coluna…"
                  className="bg-cardAlt rounded-pill px-4 h-10 text-item outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex gap-2">
                  <button onClick={submitCol} className="flex-1 bg-accent text-white rounded-pill h-9 text-item font-semibold">Adicionar</button>
                  <button onClick={() => setAddingCol(false)} className="px-3 text-muted text-item">Cancelar</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingCol(true)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-card text-item font-semibold text-muted bg-card/60 hover:bg-card shadow-card hover:text-ink transition-colors"
              >
                <Plus size={16} /> Adicionar coluna
              </button>
            )}
          </div>
        </div>
      </DndContext>

      <CardDrawer />
    </div>
  )
}
