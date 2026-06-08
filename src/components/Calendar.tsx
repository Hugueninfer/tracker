import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHabitStore } from '@/store/habitStore'
import { cx } from '@/lib/utils'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function Calendar() {
  const selectedDate = useHabitStore((s) => s.selectedDate)
  const setSelectedDate = useHabitStore((s) => s.setSelectedDate)
  const habits = useHabitStore((s) => s.habits)

  const init = new Date(selectedDate)
  const [year, setYear] = useState(init.getFullYear())
  const [month, setMonth] = useState(init.getMonth())

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // dates with any completion -> orange ring
  const eventDates = new Set(habits.flatMap((h) => h.completedDates))

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cardTitle font-bold">
          {MONTHS[month]}, {year}
        </h3>
        <div className="flex gap-1">
          <button onClick={prev} className="h-8 w-8 rounded-full hover:bg-accent-tint flex items-center justify-center text-muted">
            <ChevronLeft size={16} />
          </button>
          <button onClick={next} className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d, i) => (
          <div key={i} className="text-micro text-muted font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const dISO = iso(year, month, day)
          const selected = dISO === selectedDate
          const hasEvent = eventDates.has(dISO)
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dISO)}
              className={cx(
                'h-9 w-9 mx-auto rounded-full text-item flex items-center justify-center transition-all duration-150',
                selected && 'bg-accent text-white font-semibold',
                !selected && hasEvent && 'ring-2 ring-accent text-ink',
                !selected && !hasEvent && 'text-ink hover:bg-accent-tint'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      <p className="text-meta text-done mt-4">+3,2% vs mês passado</p>
    </div>
  )
}
