import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { AXIS, BRAND, GRID } from '@/components/charts/theme'
import type { DailyPoint } from '@/lib/aggregate'

export function AtendimentosPorDia({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...AXIS} interval={0} />
        <YAxis {...AXIS} allowDecimals={false} width={48} />
        <Tooltip
          content={<ChartTooltip unit="atendimento" dotColor={BRAND} />}
          cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={BRAND}
          strokeWidth={2}
          dot={false}
          /* Marcador >= 8px no hover, com anel na cor da superficie. */
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF', fill: BRAND }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
