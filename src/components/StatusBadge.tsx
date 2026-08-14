import { Badge } from '@/components/ui/badge'
import { getStatus, type Contact } from '@/lib/types'

/**
 * Status nao existe como coluna — e derivado de `data_agendamento`.
 * O ponto colorido garante que o estado nao dependa so da cor de fundo.
 */
export function StatusBadge({ contact }: { contact: Contact }) {
  const status = getStatus(contact)

  if (status === 'agendado') {
    return (
      <Badge variant="success">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Agendado
      </Badge>
    )
  }

  return (
    <Badge variant="info">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      Em atendimento
    </Badge>
  )
}
