import { describe, it, expect } from 'vitest'
import { formatBRL, parseAmount } from './money'

const norm = (s: string) => s.replace(/\s/g, ' ')

describe('formatBRL', () => {
  it('formats with R$ and two decimals', () => {
    expect(norm(formatBRL(1200))).toBe('R$ 1.200,00')
  })
  it('formats zero', () => {
    expect(norm(formatBRL(0))).toBe('R$ 0,00')
  })
})

describe('parseAmount', () => {
  it('parses pt-BR comma decimal', () => {
    expect(parseAmount('1.200,50')).toBe(1200.5)
  })
  it('parses plain number with dot', () => {
    expect(parseAmount('200.5')).toBe(200.5)
  })
  it('parses integer', () => {
    expect(parseAmount('200')).toBe(200)
  })
  it('returns 0 for empty/garbage', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })
})
