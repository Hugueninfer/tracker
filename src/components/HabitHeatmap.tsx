import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from 'lucide-react'
import type { Habit } from '@/lib/types'
import { useHabitStore } from '@/store/habitStore'
import { cx } from '@/lib/utils'

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]
const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// accent intensity buckets by fraction of habits completed (0..1)
function intensityClass(frac: number): string {
  if (frac <= 0) return 'bg-cardAlt text-muted'
  if (frac < 0.34) return 'bg-accent/30 text-ink'
  if (frac < 0.67) return 'bg-accent/55 text-ink'
  if (frac < 1) return 'bg-accent/80 text-white'
  return 'bg-accent text-white'
}

/** Single aggregate month calendar — cell intensity = how many habits done that day. */
function AggregateMonth({ year, month, habits }: {
  year: number
  month: number
  habits: Habit[]
}) {
  const dayCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const h of habits) for (const d of h.completedDates) {
      map.set(d, (map.get(d) ?? 0) + 1)
    }
    return map
  }, [habits])

  const total = habits.length || 1
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="max-w-md">
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DOW.map((d, i) => (
          <div key={i} className="text-micro text-muted text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />
          const count = dayCounts.get(iso(year, month, day)) ?? 0
          return (
            <div
              key={i}
              title={`${day} ${MONTHS_SHORT[month]} · ${count}/${habits.length} hábitos`}
              className={cx(
                'aspect-square rounded-badge flex items-center justify-center text-meta font-medium transition-colors',
                intensityClass(count / total)
              )}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Small month grid for the annual per-habit summary. */
function MiniMonth({ year, month, done, label }: {
  year: number
  month: number
  done: Set<string>
  label: string
}) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) if (done.has(iso(year, month, d))) count++

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-micro font-semibold text-muted">{label}</span>
        <span className="text-micro text-muted">{count}d</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="h-3.5 w-3.5" />
          const isDone = done.has(iso(year, month, day))
          return (
            <div
              key={i}
              title={`${iso(year, month, day)}${isDone ? ' · feito' : ''}`}
              className={cx('h-3.5 w-3.5 rounded-[4px] mx-auto', isDone ? 'bg-accent' : 'bg-cardAlt')}
            />
          )
        })}
      </div>
    </div>
  )
}

function YearHabitRow({ habit, year }: { habit: Habit; year: number }) {
  const done = useMemo(() => new Set(habit.completedDates), [habit.completedDates])
  const total = habit.completedDates.filter((d) => d.startsWith(String(year))).length
  return (
    <div className="py-4 border-b border-hairline last:border-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-8 w-8 rounded-badge bg-accent-tint flex items-center justify-center">
          {habit.emoji}
        </span>
        <span className="text-item font-semibold">{habit.title}</span>
        <span className="text-meta text-muted ml-auto">{total}d em {year}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
        {MONTHS_SHORT.map((m, i) => (
          <MiniMonth key={i} year={year} month={i} done={done} label={m} />
        ))}
      </div>
    </div>
  )
}

export function HabitHeatmap() {
  const habits = useHabitStore((s) => s.habits)
  const [mode, setMode] = useState<'month' | 'year'>('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const prev = () => {
    if (mode === 'year') { setYear((y) => y - 1); return }
    if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const next = () => {
    if (mode === 'year') { setYear((y) => y + 1); return }
    if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  const periodLabel = mode === 'year' ? `${year}` : `${MONTHS_FULL[month]} ${year}`

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-cardTitle font-bold">Consistência</h2>
          <p className="text-meta text-muted mt-0.5">
            {mode === 'month' ? 'Hábitos concluídos por dia' : 'Resumo anual por hábito'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button onClick={prev} className="h-8 w-8 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted">
            <ChevronLeft size={16} />
          </button>
          <span className="text-item font-semibold min-w-[7rem] text-center">{periodLabel}</span>
          <button onClick={next} className="h-8 w-8 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted">
            <ChevronRight size={16} />
          </button>

          <div className="flex bg-cardAlt rounded-pill p-1 ml-1">
            <button
              onClick={() => setMode('month')}
              className={cx(
                'flex items-center gap-1.5 px-3 h-8 rounded-pill text-meta font-semibold transition-colors',
                mode === 'month' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              )}
            >
              <CalendarDays size={14} /> Mês
            </button>
            <button
              onClick={() => setMode('year')}
              className={cx(
                'flex items-center gap-1.5 px-3 h-8 rounded-pill text-meta font-semibold transition-colors',
                mode === 'year' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              )}
            >
              <LayoutGrid size={14} /> Ano
            </button>
          </div>
        </div>
      </div>

      {mode === 'month' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <AggregateMonth year={year} month={month} habits={habits} />

          {/* legend + per-habit tally for the month */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-micro text-muted mb-4">
              <span>Menos</span>
              <span className="h-3.5 w-3.5 rounded-[4px] bg-cardAlt" />
              <span className="h-3.5 w-3.5 rounded-[4px] bg-accent/30" />
              <span className="h-3.5 w-3.5 rounded-[4px] bg-accent/55" />
              <span className="h-3.5 w-3.5 rounded-[4px] bg-accent/80" />
              <span className="h-3.5 w-3.5 rounded-[4px] bg-accent" />
              <span>Mais</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {habits.map((h) => {
                const prefix = iso(year, month, 1).slice(0, 7)
                const days = h.completedDates.filter((d) => d.startsWith(prefix)).length
                const inMonth = new Date(year, month + 1, 0).getDate()
                const pct = Math.round((days / inMonth) * 100)
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-badge bg-accent-tint flex items-center justify-center text-sm shrink-0">
                      {h.emoji}
                    </span>
                    <span className="text-item w-24 sm:w-36 truncate">{h.title}</span>
                    <div className="flex-1 h-2.5 rounded-pill bg-cardAlt overflow-hidden">
                      <div className="h-full rounded-pill bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-meta text-muted w-12 text-right">{days}d</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 text-micro text-muted mb-2">
            <span>Menos</span>
            <span className="h-3 w-3 rounded-[4px] bg-cardAlt" />
            <span className="h-3 w-3 rounded-[4px] bg-accent" />
            <span>Mais</span>
          </div>
          {habits.map((h) => (
            <YearHabitRow key={h.id} habit={h} year={year} />
          ))}
        </div>
      )}
    </div>
  )
}
