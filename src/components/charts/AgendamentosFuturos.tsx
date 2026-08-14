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
import { AXIS, BAR_RADIUS, GRID, POSITIVE } from '@/components/charts/theme'
import type { DailyPoint } from '@/lib/aggregate'

export function AgendamentosFuturos({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...AXIS} interval={0} />
        <YAxis {...AXIS} allowDecimals={false} width={48} />
        <Tooltip
          content={<ChartTooltip unit="agendamento" dotColor={POSITIVE} />}
          cursor={{ fill: '#F1F5F9' }}
        />
        <Bar
          dataKey="total"
          fill={POSITIVE}
          radius={BAR_RADIUS}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
