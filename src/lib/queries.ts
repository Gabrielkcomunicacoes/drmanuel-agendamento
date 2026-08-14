import { CRM_TABLE, supabase } from '@/lib/supabase'
import { toFilterValue, type PeriodRange } from '@/lib/periods'
import { CONTACT_COLUMNS, type Contact } from '@/lib/types'

/** PostgREST devolve no maximo 1000 linhas por request. */
const PAGE_SIZE = 1000

/**
 * Teto de seguranca para a paginacao dos graficos. A tabela ja tem 23 mil
 * linhas; sem teto um periodo largo derrubaria o navegador.
 */
const MAX_CHART_PAGES = 40

/** Teto de linhas renderizadas na tabela de Contatos (busca e local). */
export const CONTACTS_ROW_CAP = 2000

export interface PeriodCounts {
  totalContatos: number
  totalAgendamentos: number
}

/**
 * Contagens exatas via `head: true` — o Postgres conta no servidor e nenhuma
 * linha trafega. E o caminho barato para os dois cards de metrica.
 */
export async function fetchPeriodCounts(
  period: PeriodRange,
): Promise<PeriodCounts> {
  const start = toFilterValue(period.start)
  const end = toFilterValue(period.end)

  const [contatos, agendamentos] = await Promise.all([
    supabase
      .from(CRM_TABLE)
      .select('id', { count: 'exact', head: true })
      .gte('inicio_atendimento', start)
      .lte('inicio_atendimento', end),
    supabase
      .from(CRM_TABLE)
      .select('id', { count: 'exact', head: true })
      .gte('inicio_atendimento', start)
      .lte('inicio_atendimento', end)
      .not('data_agendamento', 'is', null),
  ])

  if (contatos.error) throw contatos.error
  if (agendamentos.error) throw agendamentos.error

  return {
    totalContatos: contatos.count ?? 0,
    totalAgendamentos: agendamentos.count ?? 0,
  }
}

export interface ChartSource {
  timestamps: string[]
  /** true quando o teto de paginacao cortou parte do periodo. */
  truncated: boolean
}

/** Roda as promises em lotes para nao abrir 24 conexoes de uma vez. */
async function inBatches<T>(
  tasks: (() => Promise<T>)[],
  size: number,
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < tasks.length; i += size) {
    const batch = tasks.slice(i, i + size)
    results.push(...(await Promise.all(batch.map((task) => task()))))
  }

  return results
}

/**
 * Busca APENAS a coluna `inicio_atendimento` do periodo. Serve aos graficos 1 e
 * 2 — puxar as colunas de texto aqui traria megabytes a toa.
 *
 * Como o total ja veio da contagem exata, as paginas sao disparadas em paralelo
 * em vez de uma de cada vez: com 23 mil linhas isso troca 24 idas sequenciais
 * ao servidor por 3 lotes concorrentes.
 */
export async function fetchAtendimentoTimestamps(
  period: PeriodRange,
  knownTotal: number,
): Promise<ChartSource> {
  const start = toFilterValue(period.start)
  const end = toFilterValue(period.end)

  if (knownTotal === 0) return { timestamps: [], truncated: false }

  const pagesNeeded = Math.ceil(knownTotal / PAGE_SIZE)
  const pages = Math.min(pagesNeeded, MAX_CHART_PAGES)

  const tasks = Array.from({ length: pages }, (_, page) => async () => {
    const from = page * PAGE_SIZE

    const { data, error } = await supabase
      .from(CRM_TABLE)
      .select('inicio_atendimento')
      .gte('inicio_atendimento', start)
      .lte('inicio_atendimento', end)
      .order('inicio_atendimento', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    return (data ?? [])
      .map((row) => row.inicio_atendimento)
      .filter((value): value is string => Boolean(value))
  })

  const chunks = await inBatches(tasks, 8)

  return {
    timestamps: chunks.flat(),
    truncated: pagesNeeded > MAX_CHART_PAGES,
  }
}

/** Contatos mais recentes do periodo — usado na lista do Dashboard. */
export async function fetchRecentContacts(
  period: PeriodRange,
  limit = 10,
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from(CRM_TABLE)
    .select(CONTACT_COLUMNS)
    .gte('inicio_atendimento', toFilterValue(period.start))
    .lte('inicio_atendimento', toFilterValue(period.end))
    .order('inicio_atendimento', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Contact[]
}

export interface ContactsPage {
  contacts: Contact[]
  /** Total real no periodo, mesmo quando maior que o teto renderizado. */
  total: number
  capped: boolean
}

/**
 * Contatos do periodo para a pagina de Contatos. A spec pede "sem limite", mas
 * renderizar 23 mil linhas trava o navegador — buscamos ate CONTACTS_ROW_CAP e
 * devolvemos o total exato para a UI avisar quando houver corte.
 */
export async function fetchContacts(
  period: PeriodRange,
): Promise<ContactsPage> {
  const start = toFilterValue(period.start)
  const end = toFilterValue(period.end)

  const countResult = await supabase
    .from(CRM_TABLE)
    .select('id', { count: 'exact', head: true })
    .gte('inicio_atendimento', start)
    .lte('inicio_atendimento', end)

  if (countResult.error) throw countResult.error
  const total = countResult.count ?? 0

  const contacts: Contact[] = []
  const target = Math.min(total, CONTACTS_ROW_CAP)

  while (contacts.length < target) {
    const from = contacts.length

    const { data, error } = await supabase
      .from(CRM_TABLE)
      .select(CONTACT_COLUMNS)
      .gte('inicio_atendimento', start)
      .lte('inicio_atendimento', end)
      .order('inicio_atendimento', { ascending: false })
      .range(from, Math.min(from + PAGE_SIZE, target) - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    contacts.push(...(data as Contact[]))
    if (data.length < PAGE_SIZE) break
  }

  return { contacts, total, capped: total > contacts.length }
}
