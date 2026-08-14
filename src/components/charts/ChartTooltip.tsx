import type { TooltipProps } from 'recharts'

interface ChartTooltipProps extends TooltipProps<number, string> {
  /** Termo no singular; o plural recebe "s". */
  unit?: string
  /** Campo do datum usado como titulo; cai no `label` do eixo. */
  labelKey?: string
  dotColor?: string
}

/**
 * Tooltip unico para os tres graficos. O valor usa token de texto (ink), nunca
 * a cor da serie — a identidade fica no ponto colorido ao lado.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = 'atendimento',
  labelKey = 'fullLabel',
  dotColor = '#3B82F6',
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const datum = payload[0]?.payload as Record<string, unknown> | undefined
  const title = (datum?.[labelKey] as string | undefined) ?? String(label ?? '')
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="rounded-lg border border-hairline bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-medium capitalize text-muted">{title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        {value.toLocaleString('pt-BR')}
        <span className="font-normal text-muted">
          {value === 1 ? unit : `${unit}s`}
        </span>
      </p>
    </div>
  )
}
