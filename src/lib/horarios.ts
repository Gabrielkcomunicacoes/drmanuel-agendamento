/**
 * Horarios fixos da clinica — nao vem do banco. Capacidade fixa de 1
 * agendamento por slot (ver `fetchSlotCounts` em `appointments.ts`).
 */
export const HORARIOS_SEMANA = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
]

export const HORARIOS_SABADO = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
]

/** getDay(): 0 = domingo (fechado), 6 = sabado, 1-5 = semana. */
export function getHorariosDoDia(date: Date): string[] {
  const diaSemana = date.getDay()
  if (diaSemana === 0) return []
  if (diaSemana === 6) return HORARIOS_SABADO
  return HORARIOS_SEMANA
}

export function isDiaFechado(date: Date): boolean {
  return date.getDay() === 0
}
