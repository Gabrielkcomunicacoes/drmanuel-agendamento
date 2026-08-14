import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

export type PeriodPresetId =
  | 'hoje'
  | 'ontem'
  | 'ultimos7'
  | 'ultimos14'
  | 'este_mes'
  | 'mes_passado'
  | 'personalizado'

export interface PeriodRange {
  /** Inicio do intervalo, ja no limite inferior do dia (00:00:00.000 local). */
  start: Date
  /** Fim do intervalo, ja no limite superior do dia (23:59:59.999 local). */
  end: Date
}

export interface Period extends PeriodRange {
  preset: PeriodPresetId
}

export const PERIOD_PRESETS: { id: PeriodPresetId; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: 'ultimos7', label: 'Últimos 7 dias' },
  { id: 'ultimos14', label: 'Últimos 14 dias' },
  { id: 'este_mes', label: 'Este mês' },
  { id: 'mes_passado', label: 'Mês passado' },
  { id: 'personalizado', label: 'Personalizado' },
]

/**
 * Intervalos "ultimos N dias" incluem hoje, entao o inicio recua N-1 dias.
 * `personalizado` nao tem intervalo proprio — cai no default de 7 dias ate o
 * usuario escolher as datas no calendario.
 */
export function resolvePreset(
  preset: Exclude<PeriodPresetId, 'personalizado'>,
  now: Date = new Date(),
): PeriodRange {
  switch (preset) {
    case 'hoje':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'ontem': {
      const yesterday = subDays(now, 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    }
    case 'ultimos7':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) }
    case 'ultimos14':
      return { start: startOfDay(subDays(now, 13)), end: endOfDay(now) }
    case 'este_mes':
      return { start: startOfMonth(now), end: endOfDay(now) }
    case 'mes_passado': {
      const previous = subMonths(now, 1)
      return { start: startOfMonth(previous), end: endOfMonth(previous) }
    }
  }
}

export function makePeriod(
  preset: Exclude<PeriodPresetId, 'personalizado'>,
  now: Date = new Date(),
): Period {
  return { preset, ...resolvePreset(preset, now) }
}

export function makeCustomPeriod(from: Date, to: Date): Period {
  return {
    preset: 'personalizado',
    start: startOfDay(from),
    end: endOfDay(to),
  }
}

/** timestamptz no Postgres — os filtros viajam como ISO 8601 em UTC. */
export function toFilterValue(date: Date): string {
  return date.toISOString()
}

export function describePeriod(period: Period): string {
  const start = format(period.start, 'dd/MM/yyyy')
  const end = format(period.end, 'dd/MM/yyyy')
  return start === end ? start : `${start} — ${end}`
}
