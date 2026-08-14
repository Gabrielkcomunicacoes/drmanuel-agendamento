/** Tokens compartilhados pelos tres graficos. */

export const BRAND = '#3B82F6'
export const POSITIVE = '#10B981'

/** Grid recessivo: so linhas horizontais, tracejado leve, sem borda de eixo. */
export const GRID = {
  strokeDasharray: '3 3',
  stroke: '#E2E8F0',
  vertical: false,
} as const

/** Eixos sem linha nem tick — o texto basta. */
export const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: '#64748B', fontSize: 12 },
} as const

/** Ponta arredondada de 4px ancorada na baseline. */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
