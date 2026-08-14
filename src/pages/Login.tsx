import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { Flower2 } from 'lucide-react'

import { useAuth } from '@/lib/auth'

interface LocationState {
  from?: Location
}

export default function Login() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Ja logado (ex: voltou pra /login manualmente) — manda de volta.
  if (session) {
    const state = location.state as LocationState | null
    return <Navigate to={state?.from?.pathname ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)

    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }

    const state = location.state as LocationState | null
    navigate(state?.from?.pathname ?? '/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Flower2 className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="text-xl font-semibold text-ink">
            Clínica do Dr. Manuel
          </h1>
          <p className="mt-1 text-sm text-muted">Acesso da equipe</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-xl border border-hairline bg-white p-6 shadow-card"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border border-hairline px-3.5 text-[15px] text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-hairline px-3.5 text-[15px] text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-brand text-base font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Acesso restrito à equipe da clínica. Contas são criadas
          internamente pelo administrador.
        </p>
      </div>
    </div>
  )
}
