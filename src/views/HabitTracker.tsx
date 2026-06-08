import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { HabitCard } from '@/components/HabitCard'
import { HabitHeatmap } from '@/components/HabitHeatmap'
import { DailyQuote } from '@/components/DailyQuote'
import { useHabitStore } from '@/store/habitStore'

const EMOJIS = ['📚', '🛒', '🥦', '📖', '🏊', '🏋️', '🧘', '💧', '🏃', '🎯']

export function HabitTracker() {
  const habits = useHabitStore((s) => s.habits)
  const addHabit = useHabitStore((s) => s.addHabit)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [meta, setMeta] = useState('')
  const [emoji, setEmoji] = useState('🎯')

  const doneCount = habits.filter((h) => h.doneToday).length
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0

  const submit = () => {
    if (!title.trim()) return
    addHabit({ emoji, title: title.trim(), meta: meta.trim() || 'A qualquer hora' })
    setTitle(''); setMeta(''); setEmoji('🎯'); setAdding(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* main column */}
      <div className="flex flex-col gap-5">
        {/* greeting + progress */}
        <Card>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-pageTitle font-extrabold">Olá 👋</h1>
              <p className="text-meta text-muted mt-1">
                {doneCount} de {habits.length} hábitos concluídos hoje
              </p>
            </div>
            <Button onClick={() => setAdding((v) => !v)}>
              <Plus size={18} /> Novo Hábito
            </Button>
          </div>

          {/* progress / streak bar — orange fill */}
          <div className="mt-5">
            <div className="flex justify-between text-meta text-muted mb-1.5">
              <span>Progresso de hoje</span>
              <span className="font-semibold text-ink">{pct}%</span>
            </div>
            <div className="h-3 rounded-pill bg-accent-tint overflow-hidden">
              <div
                className="h-full rounded-pill bg-accent transition-all duration-500 ease-soft"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* inline add form */}
          {adding && (
            <div className="mt-5 p-4 rounded-card bg-cardAlt flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`h-9 w-9 rounded-badge text-lg flex items-center justify-center transition ${
                      emoji === e ? 'bg-accent scale-105' : 'bg-card hover:bg-accent-tint'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Nome do hábito…"
                className="bg-card rounded-pill px-4 h-11 text-item outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Horário · local (ex: 08:00 · Casa)"
                className="bg-card rounded-pill px-4 h-11 text-item outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-2">
                <Button onClick={submit}>Adicionar</Button>
                <Button variant="secondary" onClick={() => setAdding(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </Card>

        {/* daily quote */}
        <Card tint="cream">
          <DailyQuote />
        </Card>

        {/* habit grid */}
        <Card>
          <CardHeader title="Hábitos de Hoje" action={<span>Ver detalhes</span>} />
          {habits.length === 0 ? (
            <p className="text-meta text-muted py-8 text-center">Nenhum hábito ainda — adicione um acima ☝️</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {habits.map((h) => (
                <HabitCard key={h.id} habit={h} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* heatmap — full width */}
      <Card>
        <HabitHeatmap />
      </Card>
    </div>
  )
}
