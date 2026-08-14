import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartCardProps {
  title: string
  subtitle?: string
  loading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
  height?: number
}

export function ChartCard({
  title,
  subtitle,
  loading = false,
  isEmpty = false,
  emptyMessage = 'Nenhum dado neste período',
  children,
  height = 280,
}: ChartCardProps) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        {/* Serie unica: o titulo ja nomeia a metrica, entao nao ha legenda. */}
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>

      <div style={{ height }}>
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}
