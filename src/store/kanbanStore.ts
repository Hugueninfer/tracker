import { create } from 'zustand'
import type { Column, KanbanCard, CardImage, Label, DBLabel } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import * as api from '@/lib/api/kanban'

interface KanbanState {
  columns: Column[]
  cards: Record<string, KanbanCard>
  openCardId: string | null
  loaded: boolean
  load: () => Promise<void>
  reset: () => void
  addColumn: (title: string) => Promise<void>
  renameColumn: (id: string, title: string) => Promise<void>
  removeColumn: (id: string) => Promise<void>
  setColumns: (cols: Column[]) => void
  persistColumnOrder: (cols: Column[]) => Promise<void>
  addCard: (columnId: string, title: string) => Promise<void>
  updateCard: (id: string, patch: Partial<KanbanCard>) => void
  removeCard: (id: string) => Promise<void>
  addImage: (cardId: string, img: CardImage) => void
  removeImage: (cardId: string, imgId: string) => void
  addLabel: (cardId: string, label: Label) => void
  removeLabel: (cardId: string, labelId: string) => void
  moveCard: (cardId: string, fromCol: string, toCol: string, toIndex: number) => Promise<void>
  openCard: (id: string | null) => void
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: [],
  cards: {},
  openCardId: null,
  loaded: false,

  load: async () => {
    const [cols, cards] = await Promise.all([api.listColumns(), api.listCards()])
    const cardMap: Record<string, KanbanCard> = {}
    for (const c of cards) {
      cardMap[c.id] = {
        id: c.id, title: c.title, description: c.description, notes: c.notes,
        images: [], labels: (c.labels as DBLabel[]) ?? [],
        dueDate: c.due_date ?? undefined,
      }
    }
    const columns: Column[] = cols.map((col) => ({
      id: col.id, title: col.title,
      cardIds: cards.filter((c) => c.column_id === col.id).map((c) => c.id),
    }))
    set({ columns, cards: cardMap, loaded: true })
  },
  reset: () => set({ columns: [], cards: {}, loaded: false, openCardId: null }),

  addColumn: async (title) => {
    const userId = useAuthStore.getState().user!.id
    const position = get().columns.length
    const row = await api.insertColumn(userId, title, position)
    set((s) => ({ columns: [...s.columns, { id: row.id, title, cardIds: [] }] }))
  },
  renameColumn: async (id, title) => {
    set((s) => ({ columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)) }))
    await api.updateColumn(id, { title })
  },
  removeColumn: async (id) => {
    const prev = get()
    const col = prev.columns.find((c) => c.id === id)
    const cards = { ...prev.cards }
    col?.cardIds.forEach((cid) => delete cards[cid])
    set({ columns: prev.columns.filter((c) => c.id !== id), cards })
    try { await api.deleteColumn(id) } catch { set({ columns: prev.columns, cards: prev.cards }) }
  },
  setColumns: (columns) => set({ columns }),
  persistColumnOrder: async (cols) => {
    set({ columns: cols })
    await Promise.all(cols.map((c, i) => api.updateColumn(c.id, { position: i })))
  },

  addCard: async (columnId, title) => {
    const userId = useAuthStore.getState().user!.id
    const col = get().columns.find((c) => c.id === columnId)
    const position = col ? col.cardIds.length : 0
    const row = await api.insertCard(userId, columnId, title, position)
    const card: KanbanCard = { id: row.id, title, description: '', notes: '', images: [], labels: [] }
    set((s) => ({
      cards: { ...s.cards, [card.id]: card },
      columns: s.columns.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c)),
      openCardId: card.id,
    }))
  },
  updateCard: (id, patch) => {
    set((s) => ({ cards: { ...s.cards, [id]: { ...s.cards[id], ...patch } } }))
    const dbPatch: Partial<import('@/lib/db-types').DBCard> = {}
    if ('title' in patch) dbPatch.title = patch.title
    if ('description' in patch) dbPatch.description = patch.description
    if ('notes' in patch) dbPatch.notes = patch.notes
    if ('labels' in patch) dbPatch.labels = patch.labels
    if ('dueDate' in patch) dbPatch.due_date = patch.dueDate ?? null
    if (Object.keys(dbPatch).length) void api.updateCard(id, dbPatch)
  },
  removeCard: async (id) => {
    const prev = get()
    const cards = { ...prev.cards }; delete cards[id]
    set({
      cards,
      columns: prev.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => x !== id) })),
      openCardId: prev.openCardId === id ? null : prev.openCardId,
    })
    try { await api.deleteCard(id) } catch { set({ cards: prev.cards, columns: prev.columns }) }
  },

  addImage: (cardId, img) =>
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], images: [...s.cards[cardId].images, img] } } })),
  removeImage: (cardId, imgId) =>
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], images: s.cards[cardId].images.filter((i) => i.id !== imgId) } } })),
  addLabel: (cardId, label) => {
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], labels: [...s.cards[cardId].labels, label] } } }))
    void api.updateCard(cardId, { labels: get().cards[cardId].labels })
  },
  removeLabel: (cardId, labelId) => {
    set((s) => ({ cards: { ...s.cards, [cardId]: { ...s.cards[cardId], labels: s.cards[cardId].labels.filter((l) => l.id !== labelId) } } }))
    void api.updateCard(cardId, { labels: get().cards[cardId].labels })
  },

  moveCard: async (cardId, _fromCol, toCol, toIndex) => {
    set((s) => {
      const columns = s.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }))
      for (const c of columns) {
        const i = c.cardIds.indexOf(cardId)
        if (i !== -1) c.cardIds.splice(i, 1)
      }
      const target = columns.find((c) => c.id === toCol)
      if (target) target.cardIds.splice(Math.min(toIndex, target.cardIds.length), 0, cardId)
      return { columns }
    })
    const target = get().columns.find((c) => c.id === toCol)
    const newIndex = target ? target.cardIds.indexOf(cardId) : toIndex
    await api.setCardColumnAndPosition(cardId, toCol, newIndex)
  },

  openCard: (id) => set({ openCardId: id }),
}))
