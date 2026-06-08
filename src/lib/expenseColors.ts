// 10 cores pré-definidas para cartões e categorias — tons suaves que combinam
// com o sistema (warm/soft), distintas entre si. Renderizadas via inline style
// (bg + fg), então funcionam em tema claro e escuro sem depender do Tailwind.
export interface ExpenseColor {
  id: string
  label: string
  bg: string
  fg: string
}

export const EXPENSE_COLORS: ExpenseColor[] = [
  { id: 'coral', label: 'Coral', bg: '#EF6B6E', fg: '#FFFFFF' },
  { id: 'orange', label: 'Laranja', bg: '#F2994A', fg: '#FFFFFF' },
  { id: 'amber', label: 'Âmbar', bg: '#E8B04B', fg: '#2A2A2A' },
  { id: 'lime', label: 'Limão', bg: '#9BBF5B', fg: '#2A2A2A' },
  { id: 'green', label: 'Verde', bg: '#5FAF6B', fg: '#FFFFFF' },
  { id: 'teal', label: 'Turquesa', bg: '#46B5A4', fg: '#FFFFFF' },
  { id: 'blue', label: 'Azul', bg: '#5B9BE0', fg: '#FFFFFF' },
  { id: 'indigo', label: 'Índigo', bg: '#7C82E8', fg: '#FFFFFF' },
  { id: 'purple', label: 'Roxo', bg: '#A87BE0', fg: '#FFFFFF' },
  { id: 'pink', label: 'Rosa', bg: '#E879A6', fg: '#FFFFFF' },
]

export function colorById(id: string | null | undefined): ExpenseColor {
  return EXPENSE_COLORS.find((c) => c.id === id) ?? EXPENSE_COLORS[0]
}
