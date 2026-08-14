import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { AXIS, BAR_RADIUS, BRAND, GRID } from '@/components/charts/theme'
import type { WeekdayPoint } from '@/lib/aggregate'

export function AtendimentosPorDiaSemana({ data }: { data: WeekdayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} width={48} />
        <Tooltip
          content={
            <ChartTooltip
              unit="atendimento"
              labelKey="label"
              dotColor={BRAND}
            />
          }
          cursor={{ fill: '#F1F5F9' }}
        />
        <Bar
          dataKey="total"
          fill={BRAND}
          fillOpacity={0.8}
          radius={BAR_RADIUS}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
