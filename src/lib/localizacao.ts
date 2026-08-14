/**
 * Cidades atendidas e as clinicas em cada uma. Lista fixa (nao vem do banco) —
 * mesmo padrao de src/lib/procedimentos.ts e src/lib/horarios.ts.
 */
export const CIDADES_CLINICAS: Record<string, readonly string[]> = {
  Salvador: ['Salvador Prime, Caminho das Árvores'],
  Jacobina: ['Vitta Centro Médico', 'Clínica Santa Bárbara'],
  'Morro do Chapéu': ['NB Centro Médico Odontológico'],
  'Mulungu do Morro': ['Clínica + CMAD'],
  Ourolândia: ['Clínica Adma Lopes'],
  'Caldeirão Grande': ['Conexão em Saúde'],
  Saúde: ['Clínica Saúde'],
  Pindobaçu: ['Clínica Med Vida Pindobaçu'],
  'Ruy Barbosa': ['Clínica Bela Vista'],
  Cafarnaum: ['Odonto Vida'],
  Canarana: ['Clínica Fisio Vida'],
  Ibipeba: ['Medlab Ibipeba'],
  'Capim Grosso': ['Clínica Vida'],
  'Riachão do Jacuípe': ['Clínica Vida'],
  Ipirá: ['Clínica Paula Fernandes', 'Clínica Santa Helena'],
  Quixabeira: ['Damares – Saúde & Estética'],
  'Várzea da Roça': ['Clínica Sahvida'],
  'Baixa Grande': ['Clean Saúde'],
  Itaberaba: ['Clínica AMO Saúde'],
  'Rafael Jambeiro': ['Centro Médico Cuidar'],
}

export const CIDADES = Object.keys(CIDADES_CLINICAS)

export function getClinicasDaCidade(cidade: string | undefined): readonly string[] {
  if (!cidade) return []
  return CIDADES_CLINICAS[cidade] ?? []
}
