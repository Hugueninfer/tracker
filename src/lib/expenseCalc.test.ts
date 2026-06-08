import { describe, it, expect } from 'vitest'
import { sumAmounts, balance, perCard } from './expenseCalc'
import type { Expense, Income } from './types'

const exp = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(36).slice(2), date: '2026-06-01', month: '2026-06',
  name: 'x', categoryId: null, cardId: null, amount: 0,
  installmentGroup: null, installmentIndex: 1, installmentCount: 1, ...over,
})
const inc = (amount: number): Income => ({ id: '1', month: '2026-06', name: 'r', amount })

describe('sumAmounts', () => {
  it('sums and rounds to 2 decimals', () => {
    expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3)
  })
})

describe('balance', () => {
  it('income minus expense', () => {
    expect(balance([inc(1000), inc(500)], [exp({ amount: 200 }), exp({ amount: 50 })])).toBe(1250)
  })
})

describe('perCard', () => {
  it('groups by cardId summing amounts, nulls under "no card"', () => {
    const result = perCard([
      exp({ cardId: 'a', amount: 100 }),
      exp({ cardId: 'a', amount: 50 }),
      exp({ cardId: 'b', amount: 30 }),
      exp({ cardId: null, amount: 10 }),
    ])
    expect(result).toEqual({ a: 150, b: 30, __none__: 10 })
  })
})
