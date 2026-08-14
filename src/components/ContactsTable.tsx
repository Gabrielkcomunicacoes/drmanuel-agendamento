import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { displayText, formatDateTime, formatWhatsapp } from '@/lib/format'
import type { Contact } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ContactsTableProps {
  contacts: Contact[]
  loading?: boolean
  onSelect: (contact: Contact) => void
  /** Ativa cabecalho sticky + area rolavel (usado na pagina de Contatos). */
  stickyHeader?: boolean
  emptyMessage?: string
  skeletonRows?: number
}

export function ContactsTable({
  contacts,
  loading = false,
  onSelect,
  stickyHeader = false,
  emptyMessage = 'Nenhum contato encontrado neste período',
  skeletonRows = 6,
}: ContactsTableProps) {
  if (loading) {
    return <TableSkeleton rows={skeletonRows} />
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted">
          Ajuste o período ou a busca para ver outros registros.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-x-auto scrollbar-slim',
        stickyHeader && 'max-h-[calc(100vh-320px)] overflow-y-auto',
      )}
    >
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead
          className={cn(
            'bg-white',
            stickyHeader && 'sticky top-0 z-10 shadow-[0_1px_0_0_#E2E8F0]',
          )}
        >
          <tr className="border-b border-hairline">
            <Th>Nome</Th>
            <Th>WhatsApp</Th>
            <Th>Início do atendimento</Th>
            <Th>Última mensagem</Th>
            <Th className="min-w-[240px]">Motivo do contato</Th>
            <Th>Status</Th>
          </tr>
        </thead>

        <tbody>
          {contacts.map((contact, index) => (
            <tr
              key={contact.id}
              tabIndex={0}
              role="button"
              onClick={() => onSelect(contact)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(contact)
                }
              }}
              className={cn(
                'cursor-pointer border-b border-hairline transition-colors last:border-b-0',
                index % 2 === 1 && 'bg-zebra',
                'hover:bg-brand-soft/60 focus:bg-brand-soft/60 focus:outline-none',
              )}
            >
              <Td className="font-medium text-ink">
                {displayText(contact.nome_lead)}
              </Td>
              <Td className="tabular-nums">
                {formatWhatsapp(contact.whatsapp_lead)}
              </Td>
              <Td className="tabular-nums">
                {formatDateTime(contact.inicio_atendimento)}
              </Td>
              <Td className="tabular-nums">
                {formatDateTime(contact.ultima_mensagem_lead)}
              </Td>
              <Td>
                <span className="line-clamp-2 max-w-[380px]">
                  {displayText(contact.motivo_contato)}
                </span>
              </Td>
              <Td>
                <StatusBadge contact={contact} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted',
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-5 py-3.5 align-middle text-muted', className)}>
      {children}
    </td>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="px-5 py-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      ))}
    </div>
  )
}
