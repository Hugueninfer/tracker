import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'

export function Auth() {
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email.trim(), password)
    setBusy(false)
    if (error) { setMsg(error); return }
    if (mode === 'signup') setMsg('Conta criada! Verifique seu email para confirmar.')
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-card shadow-card p-7">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🌱</span>
          <span className="text-lg font-extrabold">Tracker</span>
        </div>
        <h1 className="text-pageTitle font-extrabold mb-1">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="text-meta text-muted mb-5">
          {mode === 'login' ? 'Acesse seus hábitos e quadros.' : 'Comece a organizar sua rotina.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-cardAlt rounded-pill px-4 h-11">
            <Mail size={16} className="text-muted" />
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-transparent outline-none text-item w-full placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-2 bg-cardAlt rounded-pill px-4 h-11">
            <Lock size={16} className="text-muted" />
            <input
              type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="bg-transparent outline-none text-item w-full placeholder:text-muted"
            />
          </div>
          <Button type="submit" className="w-full mt-1" disabled={busy}>
            {busy ? '...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        {msg && <p className="text-meta text-muted mt-3">{msg}</p>}

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
          className="text-meta text-accent font-semibold mt-4"
        >
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
