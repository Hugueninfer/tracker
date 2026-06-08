import { Check, Flame, Trash2 } from 'lucide-react'
import type { Habit } from '@/lib/types'
import { useHabitStore } from '@/store/habitStore'
import { cx } from '@/lib/utils'

export function HabitCard({ habit }: { habit: Habit }) {
  const toggle = useHabitStore((s) => s.toggleHabit)
  const remove = useHabitStore((s) => s.removeHabit)
  const done = habit.doneToday

  return (
    <div className="group bg-card rounded-card shadow-card p-5 flex items-center gap-4 transition-all duration-200 ease-soft hover:shadow-cardHover hover:scale-[1.01]">
      {/* emoji badge — rounded square 40px */}
      <div className="h-10 w-10 shrink-0 rounded-badge bg-accent-tint flex items-center justify-center text-xl">
        {habit.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className={cx('text-item font-semibold truncate', done && 'text-muted line-through decoration-1')}>
          {habit.title}
        </div>
        <div className="text-meta text-muted truncate">{habit.meta}</div>
      </div>

      {/* streak chip */}
      <div className="hidden sm:flex items-center gap-1 text-meta text-muted">
        <Flame size={14} className="text-accent" />
        {habit.streak}
      </div>

      {/* delete (hover) */}
      <button
        onClick={() => remove(habit.id)}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-tint-coral transition-opacity"
        aria-label="Excluir hábito"
      >
        <Trash2 size={16} />
      </button>

      {/* completion toggle */}
      <button
        onClick={() => toggle(habit.id)}
        aria-label={done ? 'Desmarcar' : 'Marcar como feito'}
        className={cx(
          'h-7 w-7 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ease-soft',
          done
            ? 'bg-done text-white scale-100'
            : 'border-2 border-hairline text-transparent hover:border-accent'
        )}
      >
        <Check size={15} strokeWidth={3} />
      </button>
    </div>
  )
}
