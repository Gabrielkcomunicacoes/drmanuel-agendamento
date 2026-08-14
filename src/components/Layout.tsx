import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <main className="ml-64 min-w-[1016px]">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {actions}
    </header>
  )
}
