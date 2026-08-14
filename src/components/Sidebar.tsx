import { NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, Flower2, LayoutDashboard, LogOut, Users } from 'lucide-react'

import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/contatos', label: 'Contatos', icon: Users, end: false },
  { to: '/agendamentos', label: 'Agendamentos', icon: CalendarDays, end: false },
]

export function Sidebar() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-hairline bg-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Flower2 className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-base font-semibold text-ink">Dr. Manuel</p>
          <p className="text-xs text-muted">Clínica</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-muted hover:bg-neutral hover:text-ink',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-hairline px-5 py-4">
        {session?.user.email && (
          <p className="mb-2 truncate text-xs font-medium text-ink" title={session.user.email}>
            {session.user.email}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Sair
        </button>
        <p className="text-xs text-muted/70">Gestão de contatos e atendimentos</p>
      </div>
    </aside>
  )
}
