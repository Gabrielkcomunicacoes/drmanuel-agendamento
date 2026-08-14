import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const EMPTY = '—'

/**
 * Campos de texto vem do banco como string vazia quando o agente nao extraiu a
 * informacao — tratamos "" igual a null para nunca renderizar celula em branco.
 */
export function displayText(value: string | null | undefined): string {
  if (value === null || value === undefined) return EMPTY
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : EMPTY
}

export function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** Converte o timestamptz ISO do PostgREST em Date, ou null se ausente/invalido. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

/** DD/MM/YYYY HH:mm — formato pedido na spec para as colunas de data. */
export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? format(date, 'dd/MM/yyyy HH:mm') : EMPTY
}

export function formatDate(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? format(date, 'dd/MM/yyyy') : EMPTY
}

/**
 * `yyyy-MM-dd` local — usado tanto para consultar a coluna `date` do Postgres
 * quanto como chave estavel de agrupamento por dia.
 */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Recebe uma data-only ISO (`yyyy-MM-dd`, coluna `date` do Postgres) e formata
 * como DD/MM/YYYY. Usa `parseISO`, nunca `new Date(string)` — o construtor
 * nativo interpreta data-only como UTC meia-noite e pode voltar um dia em
 * fusos negativos (BRT = UTC-3).
 */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return EMPTY
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : EMPTY
}

/** Data por extenso, ex: "segunda-feira, 14 de julho de 2025". */
export function formatDateExtenso(value: string | null | undefined): string {
  if (!value) return EMPTY
  const parsed = parseISO(value)
  return isValid(parsed)
    ? format(parsed, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : EMPTY
}

/** Coluna `time` do Postgres chega como `HH:mm:ss` — exibimos so `HH:mm`. */
export function formatHorario(value: string | null | undefined): string {
  if (!value) return EMPTY
  return value.slice(0, 5)
}

/**
 * Mascara progressiva `(00) 00000-0000` aplicada enquanto o usuario digita.
 * Limita a 11 digitos (DDD + 9 do celular).
 */
export function maskWhatsappInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''

  const ddd = digits.slice(0, 2)
  if (digits.length <= 2) return `(${ddd}`

  const rest = digits.slice(2)
  if (rest.length <= 5) return `(${ddd}) ${rest}`

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export function countDigits(value: string): number {
  return value.replace(/\D/g, '').length
}

/**
 * Normaliza o numero para o formato aceito pelo wa.me (apenas digitos).
 * Retorna null quando nao sobra nada utilizavel.
 */
export function whatsappHref(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length > 0 ? `https://wa.me/${digits}` : null
}

/** Exibe 5532998567307 como +55 (32) 99856-7307 quando o padrao BR bate. */
export function formatWhatsapp(value: string | null | undefined): string {
  if (!hasText(value)) return EMPTY
  const digits = value!.replace(/\D/g, '')

  const br = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  if (br) return `+55 (${br[1]}) ${br[2]}-${br[3]}`

  const local = digits.match(/^(\d{2})(\d{4,5})(\d{4})$/)
  if (local) return `(${local[1]}) ${local[2]}-${local[3]}`

  return value!.trim()
}
