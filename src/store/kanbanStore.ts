import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Column, KanbanCard, CardImage, Label } from '@/lib/types'
import { uid } from '@/lib/utils'

interface KanbanState {
  columns: Column[]
  cards: Record<string, KanbanCard>
  openCardId: string | null

  // columns
  addColumn: (title: string) => void
  renameColumn: (id: string, title: string) => void
  removeColumn: (id: string) => void
  setColumns: (cols: Column[]) => void

  // cards
  addCard: (columnId: string, title: string) => void
  updateCard: (id: string, patch: Partial<KanbanCard>) => void
  removeCard: (id: string) => void
  addImage: (cardId: string, img: CardImage) => void
  removeImage: (cardId: string, imgId: string) => void
  addLabel: (cardId: string, label: Label) => void
  removeLabel: (cardId: string, labelId: string) => void

  // dnd
  moveCard: (
    cardId: string,
    fromCol: string,
    toCol: string,
    toIndex: number
  ) => void

  // drawer
  openCard: (id: string | null) => void
}

function mkCard(title: string, partial: Partial<KanbanCard> = {}): KanbanCard {
  return {
    id: uid(),
    title,
    description: '',
    notes: '',
    images: [],
    labels: [],
    ...partial,
  }
}

const c1 = mkCard('Desenhar a tela inicial', {
  description: '<p>Ajustar o <strong>CTA laranja</strong> e os espaçamentos.</p>',
  labels: [{ id: uid(), name: 'Design', tint: 'accent' }],
})
const c2 = mkCard('Montar o widget de calendário', {
  labels: [{ id: uid(), name: 'Frontend', tint: 'sage' }],
})
const c3 = mkCard('Arrastar e soltar no kanban', {
  description: '<p>Usar o <code>@dnd-kit</code> sortable.</p>',
})
const c4 = mkCard('Lançar a v1 🎉')

const seedCards: Record<string, KanbanCard> = {
  [c1.id]: c1,
  [c2.id]: c2,
  [c3.id]: c3,
  [c4.id]: c4,
}

const seedColumns: Column[] = [
  { id: uid(), title: 'A fazer', cardIds: [c1.id, c2.id] },
  { id: uid(), title: 'Em progresso', cardIds: [c3.id] },
  { id: uid(), title: 'Concluído', cardIds: [c4.id] },
]

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      columns: seedColumns,
      cards: seedCards,
      openCardId: null,

      addColumn: (title) =>
        set((s) => ({
          columns: [...s.columns, { id: uid(), title, cardIds: [] }],
        })),
      renameColumn: (id, title) =>
        set((s) => ({
          columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)),
        })),
      removeColumn: (id) =>
        set((s) => {
          const col = s.columns.find((c) => c.id === id)
          const cards = { ...s.cards }
          col?.cardIds.forEach((cid) => delete cards[cid])
          return { columns: s.columns.filter((c) => c.id !== id), cards }
        }),
      setColumns: (cols) => set({ columns: cols }),

      addCard: (columnId, title) =>
        set((s) => {
          const card = mkCard(title)
          return {
            cards: { ...s.cards, [card.id]: card },
            columns: s.columns.map((c) =>
              c.id === columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c
            ),
            openCardId: card.id,
          }
        }),
      updateCard: (id, patch) =>
        set((s) => ({ cards: { ...s.cards, [id]: { ...s.cards[id], ...patch } } })),
      removeCard: (id) =>
        set((s) => {
          const cards = { ...s.cards }
          delete cards[id]
          return {
            cards,
            columns: s.columns.map((c) => ({
              ...c,
              cardIds: c.cardIds.filter((cid) => cid !== id),
            })),
            openCardId: s.openCardId === id ? null : s.openCardId,
          }
        }),
      addImage: (cardId, img) =>
        set((s) => ({
          cards: {
            ...s.cards,
            [cardId]: { ...s.cards[cardId], images: [...s.cards[cardId].images, img] },
          },
        })),
      removeImage: (cardId, imgId) =>
        set((s) => ({
          cards: {
            ...s.cards,
            [cardId]: {
              ...s.cards[cardId],
              images: s.cards[cardId].images.filter((i) => i.id !== imgId),
            },
          },
        })),
      addLabel: (cardId, label) =>
        set((s) => ({
          cards: {
            ...s.cards,
            [cardId]: { ...s.cards[cardId], labels: [...s.cards[cardId].labels, label] },
          },
        })),
      removeLabel: (cardId, labelId) =>
        set((s) => ({
          cards: {
            ...s.cards,
            [cardId]: {
              ...s.cards[cardId],
              labels: s.cards[cardId].labels.filter((l) => l.id !== labelId),
            },
          },
        })),

      moveCard: (cardId, fromCol, toCol, toIndex) =>
        set((s) => {
          const columns = s.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }))
          const from = columns.find((c) => c.id === fromCol)
          const to = columns.find((c) => c.id === toCol)
          if (!from || !to) return {}
          const curIdx = from.cardIds.indexOf(cardId)
          if (curIdx === -1) return {}
          from.cardIds.splice(curIdx, 1)
          const insertAt = Math.min(Math.max(toIndex, 0), to.cardIds.length)
          to.cardIds.splice(insertAt, 0, cardId)
          return { columns }
        }),

      openCard: (id) => set({ openCardId: id }),
    }),
    { name: 'tracker.kanban.v2' }
  )
)
