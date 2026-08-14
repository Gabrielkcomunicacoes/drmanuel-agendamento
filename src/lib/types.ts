/**
 * Espelha as colunas reais da tabela `crm_estetica` (confirmadas por
 * introspecao). Todos os campos de data sao `timestamptz`, entao chegam do
 * PostgREST como string ISO 8601 — ou null.
 *
 * Atencao: as colunas de texto do banco costumam vir como string VAZIA em vez
 * de null quando o agente nao conseguiu extrair a informacao. Use `displayText`
 * de `format.ts` para nao renderizar celulas em branco.
 */
export interface Contact {
  id: number
  nome_lead: string | null
  whatsapp_lead: string | null
  motivo_contato: string | null
  procedimento_interesse: string | null
  resumo_conversa: string | null
  inicio_atendimento: string | null
  follow_up_1: string | null
  follow_up_2: string | null
  data_agendamento: string | null
  id_agendamento: string | null
  ultima_mensagem_lead: string | null
}

/** Colunas pedidas na spec. As colunas `*_chatwoot` do banco nao sao usadas. */
export const CONTACT_COLUMNS =
  'id, nome_lead, whatsapp_lead, motivo_contato, procedimento_interesse, resumo_conversa, inicio_atendimento, follow_up_1, follow_up_2, data_agendamento, id_agendamento, ultima_mensagem_lead'

export type ContactStatus = 'agendado' | 'em_atendimento'

/**
 * A tabela nao tem coluna de status — ele e derivado no frontend:
 * `data_agendamento` preenchida => agendado.
 */
export function getStatus(contact: Contact): ContactStatus {
  return contact.data_agendamento ? 'agendado' : 'em_atendimento'
}
