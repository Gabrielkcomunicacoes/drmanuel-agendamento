/**
 * Verificacao pontual da logica de agendamento (Prompt 2).
 * Uso: node scripts/check-booking.mjs
 */
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

let failures = 0
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) {
    console.log(`      esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`)
  }
}

// --- horarios por dia da semana ---
const HORARIOS_SEMANA = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']
const HORARIOS_SABADO = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00']
function getHorariosDoDia(date) {
  const d = date.getDay()
  if (d === 0) return []
  if (d === 6) return HORARIOS_SABADO
  return HORARIOS_SEMANA
}

check('segunda tem 12 horarios (08h-19h)', getHorariosDoDia(new Date(2026, 7, 17)).length, 12) // 17/08/2026 = segunda
check('sabado tem 7 horarios (09h-15h)', getHorariosDoDia(new Date(2026, 7, 22)).length, 7) // 22/08/2026 = sabado
check('domingo fechado', getHorariosDoDia(new Date(2026, 7, 23)).length, 0) // 23/08/2026 = domingo

// --- mascara progressiva do whatsapp ---
function maskWhatsappInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  const ddd = digits.slice(0, 2)
  if (digits.length <= 2) return `(${ddd}`
  const rest = digits.slice(2)
  if (rest.length <= 5) return `(${ddd}) ${rest}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

check('mascara com 2 digitos', maskWhatsappInput('32'), '(32')
check('mascara com 7 digitos', maskWhatsappInput('3299999'), '(32) 99999')
check('mascara completa (11 digitos)', maskWhatsappInput('32999998888'), '(32) 99999-8888')
check('mascara ignora letras misturadas', maskWhatsappInput('(32) 99999-8888abc'), '(32) 99999-8888')
check('mascara trava em 11 digitos', maskWhatsappInput('329999988889999'), '(32) 99999-8888')

function countDigits(value) {
  return value.replace(/\D/g, '').length
}
check('WhatsApp com 11 digitos passa na validacao (>=10)', countDigits('(32) 99999-8888') >= 10, true)
check('WhatsApp com 8 digitos falha na validacao (>=10)', countDigits('(32) 9999') >= 10, false)

// --- formatacao de data/hora vindas do Postgres ---
function formatDateExtenso(value) {
  const parsed = parseISO(value)
  return format(parsed, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}
check(
  'data por extenso',
  formatDateExtenso('2026-08-17'), // segunda-feira
  'segunda-feira, 17 de agosto de 2026',
)

function formatHorario(value) {
  return value.slice(0, 5)
}
check('horario HH:mm:ss vira HH:mm', formatHorario('09:00:00'), '09:00')

// --- toDateKey / round trip local (sem deslocamento de fuso) ---
function toDateKey(date) {
  return format(date, 'yyyy-MM-dd')
}
const someDate = new Date(2026, 7, 20) // 20/08/2026 local, meia-noite
const key = toDateKey(someDate)
check('toDateKey produz yyyy-MM-dd', key, '2026-08-20')
check(
  'parseISO(toDateKey(d)) volta pro mesmo dia local (sem -1 dia por UTC)',
  format(parseISO(key), 'dd/MM/yyyy'),
  '20/08/2026',
)

console.log(
  failures === 0
    ? '\nTodas as verificacoes passaram.'
    : `\n${failures} verificacao(oes) falharam.`,
)
process.exit(failures === 0 ? 0 : 1)
