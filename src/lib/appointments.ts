import { supabase } from '@/lib/supabase'

export const APPOINTMENTS_TABLE = 'agendamentos'

/**
 * `data_agendamento` e `date` (chega como `yyyy-MM-dd`), `horario` e `time`
 * (chega como `HH:mm:ss`), `criado_em` e `timestamptz` (ISO 8601).
 */
export interface Appointment {
  id: string
  nome: string
  whatsapp: string
  procedimento: string
  data_agendamento: string
  horario: string
  criado_em: string | null
}

export interface NewAppointment {
  nome: string
  whatsapp: string
  procedimento: string
  data_agendamento: string
  horario: string
}

const APPOINTMENT_COLUMNS =
  'id, nome, whatsapp, procedimento, data_agendamento, horario, criado_em'

/** Total de agendamentos com `data_agendamento >= hoje` — card de resumo. */
export async function fetchUpcomingAppointmentsCount(
  todayKey: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(APPOINTMENTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .gte('data_agendamento', todayKey)

  if (error) throw error
  return count ?? 0
}

/** Agendamentos futuros, ordenados por data e horario crescentes. */
export async function fetchUpcomingAppointments(
  todayKey: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from(APPOINTMENTS_TABLE)
    .select(APPOINTMENT_COLUMNS)
    .gte('data_agendamento', todayKey)
    .order('data_agendamento', { ascending: true })
    .order('horario', { ascending: true })

  if (error) throw error
  return (data ?? []) as Appointment[]
}

/**
 * `data_agendamento` de todos os agendamentos entre `fromKey` e `toKey`
 * (inclusive) — usado pelo grafico 3 do Dashboard, que agrupa por dia.
 */
export async function fetchAppointmentDatesInRange(
  fromKey: string,
  toKey: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from(APPOINTMENTS_TABLE)
    .select('data_agendamento')
    .gte('data_agendamento', fromKey)
    .lte('data_agendamento', toKey)

  if (error) throw error
  return (data ?? [])
    .map((row) => row.data_agendamento)
    .filter((value): value is string => Boolean(value))
}

/**
 * Quantos agendamentos ja existem por horario num dia — capacidade fixa de 1
 * por slot, entao qualquer contagem >= 1 marca o horario como lotado.
 */
export async function fetchSlotCounts(
  dateKey: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from(APPOINTMENTS_TABLE)
    .select('horario')
    .eq('data_agendamento', dateKey)

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (!row.horario) continue
    const key = row.horario.slice(0, 5)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export async function insertAppointment(
  payload: NewAppointment,
): Promise<void> {
  const { error } = await supabase.from(APPOINTMENTS_TABLE).insert(payload)
  if (error) throw error
}
