const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number): string {
  return fmt.format(value)
}

// Accepts pt-BR ("1.200,50") or plain ("200.5"/"200"). Returns 0 if unparseable.
export function parseAmount(input: string): number {
  if (!input) return 0
  let s = input.trim().replace(/[^\d.,-]/g, '')
  if (s.includes(',')) {
    // pt-BR: dots are thousands, comma is decimal
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
