import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { toDate } from '@/lib/format'
import type { PeriodRange } from '@/lib/periods'

export interface DailyPoint {
  /** Chave estavel yyyy-MM-dd, usada so internamente. */
  key: string
  /** Rotulo curto do eixo X. */
  label: string
  /** Rotulo completo, mostrado no tooltip. */
  fullLabel: string
  total: number
}

export interface WeekdayPoint {
  label: string
  total: number
}

const DAY_KEY = 'yyyy-MM-dd'

/**
 * Serie diaria com TODOS os dias do periodo, inclusive os zerados — sem isso a
 * linha "pula" dias vazios e distorce a leitura da tendencia.
 */
export function buildDailySeries(
  timestamps: string[],
  period: PeriodRange,
): DailyPoint[] {
  const counts = new Map<string, number>()

  for (const timestamp of timestamps) {
    const date = toDate(timestamp)
    if (!date) continue
    const key = format(date, DAY_KEY)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const start = startOfDay(period.start)
  const days = differenceInCalendarDays(period.end, start) + 1
  const total = Math.max(days, 1)

  // Periodos longos nao cabem no eixo — mostramos 1 rotulo a cada N dias.
  const labelEvery = total > 45 ? Math.ceil(total / 15) : 1

  return Array.from({ length: total }, (_, index) => {
    const date = addDays(start, index)
    const key = format(date, DAY_KEY)

    return {
      key,
      label:
        index % labelEvery === 0 ? format(date, 'dd/MM', { locale: ptBR }) : '',
      fullLabel: format(date, "dd 'de' MMMM", { locale: ptBR }),
      total: counts.get(key) ?? 0,
    }
  })
}

/** Ordem Seg→Dom pedida na spec (getDay() devolve 0 = domingo). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
  0: 'Dom',
}

export function buildWeekdaySeries(timestamps: string[]): WeekdayPoint[] {
  const counts = new Map<number, number>()

  for (const timestamp of timestamps) {
    const date = toDate(timestamp)
    if (!date) continue
    const day = date.getDay()
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return WEEKDAY_ORDER.map((day) => ({
    label: WEEKDAY_LABELS[day],
    total: counts.get(day) ?? 0,
  }))
}

/** Proximos `days` dias a partir de amanha, sempre com todos os dias presentes. */
export function buildUpcomingSeries(
  timestamps: string[],
  from: Date,
  days: number,
): DailyPoint[] {
  const counts = new Map<string, number>()

  for (const timestamp of timestamps) {
    const date = toDate(timestamp)
    if (!date) continue
    const key = format(date, DAY_KEY)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const start = startOfDay(from)

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index)
    const key = format(date, DAY_KEY)

    return {
      key,
      label: format(date, 'dd/MM'),
      fullLabel: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
      total: counts.get(key) ?? 0,
    }
  })
}
