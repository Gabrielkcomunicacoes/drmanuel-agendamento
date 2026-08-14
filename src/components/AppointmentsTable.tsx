import type { Appointment } from '@/lib/appointments'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatDateOnly,
  formatDateTime,
  formatHorario,
  formatWhatsapp,
  hasText,
  whatsappHref,
} from '@/lib/format'
import { cn } from '@/lib/utils'

interface AppointmentsTableProps {
  appointments: Appointment[]
  loading?: boolean
}

export function AppointmentsTable({
  appointments,
  loading = false,
}: AppointmentsTableProps) {
  if (loading) {
    return <TableSkeleton />
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">
          Nenhum agendamento futuro encontrado.
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-320px)] overflow-auto scrollbar-slim">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E2E8F0]">
          <tr className="border-b border-hairline">
            <Th>Nome</Th>
            <Th>WhatsApp</Th>
            <Th>Procedimento</Th>
            <Th>Data</Th>
            <Th>Horário</Th>
            <Th>Agendado em</Th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((appointment, index) => {
            const href = whatsappHref(appointment.whatsapp)

            return (
              <tr
                key={appointment.id}
                className={cn(
                  'border-b border-hairline transition-colors last:border-b-0 hover:bg-brand-soft/40',
                  index % 2 === 1 && 'bg-zebra',
                )}
              >
                <Td className="font-medium text-ink">{appointment.nome}</Td>
                <Td>
                  {href && hasText(appointment.whatsapp) ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tabular-nums text-brand hover:underline"
                    >
                      {formatWhatsapp(appointment.whatsapp)}
                    </a>
                  ) : (
                    <span className="tabular-nums">
                      {formatWhatsapp(appointment.whatsapp)}
                    </span>
                  )}
                </Td>
                <Td>{appointment.procedimento}</Td>
                <Td className="tabular-nums">
                  {formatDateOnly(appointment.data_agendamento)}
                </Td>
                <Td className="tabular-nums">
                  {formatHorario(appointment.horario)}
                </Td>
                <Td className="tabular-nums">
                  {formatDateTime(appointment.criado_em)}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted"
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

function TableSkeleton() {
  return (
    <div className="px-5 py-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-hairline py-3.5 last:border-b-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}
