import { describe, it, expect } from 'vitest'
import { monthOf, addMonths, monthLabel, currentMonth, buildInstallments } from './expenseMonth'

describe('monthOf', () => {
  it('extracts YYYY-MM from a date string', () => {
    expect(monthOf('2026-06-10')).toBe('2026-06')
  })
})

describe('addMonths', () => {
  it('adds months within a year', () => {
    expect(addMonths('2026-06', 2)).toBe('2026-08')
  })
  it('rolls over the year', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02')
  })
  it('goes backwards', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})

describe('monthLabel', () => {
  it('renders pt-BR label', () => {
    expect(monthLabel('2026-06')).toBe('Junho 2026')
  })
})

describe('buildInstallments', () => {
  it('single when count <= 1', () => {
    const rows = buildInstallments({ date: '2026-06-10', amount: 200, count: 1 })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ date: '2026-06-10', month: '2026-06', amount: 200, installmentIndex: 1, installmentCount: 1, installmentGroup: null })
  })
  it('spreads N months from the date, rolling the year', () => {
    const rows = buildInstallments({ date: '2026-11-15', amount: 100, count: 3 })
    expect(rows.map((r) => r.month)).toEqual(['2026-11', '2026-12', '2027-01'])
    expect(rows.map((r) => r.date)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15'])
    expect(rows.every((r) => r.amount === 100)).toBe(true)
    expect(rows.map((r) => r.installmentIndex)).toEqual([1, 2, 3])
    expect(rows.every((r) => r.installmentCount === 3)).toBe(true)
    expect(new Set(rows.map((r) => r.installmentGroup)).size).toBe(1)
    expect(rows[0].installmentGroup).not.toBeNull()
  })
  it('clamps end-of-month day (Jan 31 + 1 month -> Feb 28/29)', () => {
    const rows = buildInstallments({ date: '2026-01-31', amount: 50, count: 2 })
    expect(rows[1].month).toBe('2026-02')
    expect(rows[1].date.startsWith('2026-02-2')).toBe(true)
  })
})
