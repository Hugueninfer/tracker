import { CheckCircle2, Flame, Target, Clock } from 'lucide-react'
import { useHabitStore } from '@/store/habitStore'

export function DailySummary() {
  const habits = useHabitStore((s) => s.habits)

  const total = habits.length
  const done = habits.filter((h) => h.doneToday).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0)
  const pending = habits.filter((h) => !h.doneToday).map((h) => h.title)

  const stats = [
    { icon: CheckCircle2, label: 'Concluídos', value: `${done}/${total}` },
    { icon: Target, label: 'Taxa', value: `${pct}%` },
    { icon: Flame, label: 'Maior streak', value: `${bestStreak}d` },
    { icon: Clock, label: 'Pendentes', value: `${pending.length}` },
  ]

  return (
    <div className="mt-5 pt-5 border-t border-ink/10">
      <p className="text-meta text-muted font-semibold mb-3">Resumo de hoje</p>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card/60 rounded-badge px-3 py-2.5 flex items-center gap-2.5">
            <s.icon size={18} className="text-accent shrink-0" />
            <div className="min-w-0">
              <div className="text-item font-bold leading-none">{s.value}</div>
              <div className="text-micro text-muted truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <p className="text-meta text-muted mt-3 truncate">
          Falta: <span className="text-ink">{pending.join(', ')}</span>
        </p>
      )}
      {total > 0 && pending.length === 0 && (
        <p className="text-meta text-done mt-3 font-semibold">Tudo concluído hoje! 🎉</p>
      )}
    </div>
  )
}
