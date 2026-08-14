import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  /** Cor do icone/plaque. `brand` = azul, `positive` = verde. */
  tone?: 'brand' | 'positive'
  loading?: boolean
}

const TONES = {
  brand: 'bg-brand-soft text-brand',
  positive: 'bg-emerald-50 text-emerald-600',
} as const

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  loading = false,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-3xl font-semibold leading-none tracking-tight text-ink tabular-nums">
            {value.toLocaleString('pt-BR')}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">{hint}</p>
      </div>
    </Card>
  )
}
