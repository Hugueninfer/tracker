import { describe, it, expect } from 'vitest'
import { computeStreak, isDoneToday } from './streak'

const iso = (d: Date) => d.toISOString().slice(0, 10)
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}

describe('isDoneToday', () => {
  it('true when today present', () => {
    expect(isDoneToday([daysAgo(0)])).toBe(true)
  })
  it('false when today absent', () => {
    expect(isDoneToday([daysAgo(1)])).toBe(false)
  })
})

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3)
  })
  it('counts streak ending yesterday when today not done', () => {
    expect(computeStreak([daysAgo(1), daysAgo(2)])).toBe(2)
  })
  it('breaks on a gap', () => {
    expect(computeStreak([daysAgo(0), daysAgo(2), daysAgo(3)])).toBe(1)
  })
  it('zero for empty', () => {
    expect(computeStreak([])).toBe(0)
  })
})
