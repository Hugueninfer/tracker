import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const email = process.env.SEED_OWNER_EMAIL!
const password = process.env.SEED_OWNER_PASSWORD!

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  // create (or fetch) the owner user, email pre-confirmed
  let userId: string
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error) {
    // already exists -> find by listing
    const list = await admin.auth.admin.listUsers()
    const found = list.data.users.find((u) => u.email === email)
    if (!found) throw created.error
    userId = found.id
  } else {
    userId = created.data.user!.id
  }

  // profile (upsert)
  await admin.from('profiles').upsert({ id: userId, email, name: 'Pedro' })

  // wipe existing seed data for idempotency
  await admin.from('columns').delete().eq('user_id', userId)
  await admin.from('habits').delete().eq('user_id', userId)

  // habits
  const habits = [
    { emoji: '📚', title: 'Estudar', meta: '10:00 · Cafeteria', position: 0 },
    { emoji: '🛒', title: 'Compras', meta: '14:00 · Mercado', position: 1 },
    { emoji: '🥦', title: 'Comer saudável', meta: '08:30 · Casa', position: 2 },
    { emoji: '📖', title: 'Ler um livro', meta: '08:00 · Biblioteca', position: 3 },
    { emoji: '🏊', title: 'Natação 45min', meta: '06:00 · Piscina', position: 4 },
  ].map((h) => ({ ...h, user_id: userId }))
  await admin.from('habits').insert(habits)

  // columns
  const { data: cols } = await admin.from('columns').insert([
    { user_id: userId, title: 'A fazer', position: 0 },
    { user_id: userId, title: 'Em progresso', position: 1 },
    { user_id: userId, title: 'Concluído', position: 2 },
  ]).select()

  const todo = cols!.find((c) => c.title === 'A fazer')!.id
  const doing = cols!.find((c) => c.title === 'Em progresso')!.id
  const done = cols!.find((c) => c.title === 'Concluído')!.id

  await admin.from('cards').insert([
    { user_id: userId, column_id: todo, title: 'Desenhar a tela inicial', position: 0,
      description: '<p>Ajustar o <strong>CTA laranja</strong> e os espaçamentos.</p>',
      labels: [{ id: crypto.randomUUID(), name: 'Design', tint: 'accent' }] },
    { user_id: userId, column_id: todo, title: 'Montar o widget de calendário', position: 1,
      labels: [{ id: crypto.randomUUID(), name: 'Frontend', tint: 'sage' }] },
    { user_id: userId, column_id: doing, title: 'Arrastar e soltar no kanban', position: 0,
      description: '<p>Usar o <code>@dnd-kit</code> sortable.</p>' },
    { user_id: userId, column_id: done, title: 'Lançar a v1 🎉', position: 0 },
  ])

  console.log('Seed done for', email, userId)
}

main().catch((e) => { console.error(e); process.exit(1) })
