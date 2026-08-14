import type { ReactNode } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  MessageSquareText,
  Phone,
  Sparkles,
} from 'lucide-react'

import { StatusBadge } from '@/components/StatusBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  displayText,
  formatDateTime,
  formatWhatsapp,
  hasText,
  whatsappHref,
} from '@/lib/format'
import type { Contact } from '@/lib/types'

interface ContactModalProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactModal({
  contact,
  open,
  onOpenChange,
}: ContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {contact && (
          <div className="max-h-[85vh] overflow-y-auto scrollbar-slim">
            <div className="border-b border-hairline p-6 pr-14">
              <DialogTitle>{displayText(contact.nome_lead)}</DialogTitle>
              <DialogDescription className="sr-only">
                Detalhes do contato
              </DialogDescription>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge contact={contact} />
                <WhatsappLink value={contact.whatsapp_lead} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6">
              <Field
                icon={<MessageSquareText className="h-3.5 w-3.5" />}
                label="Início do atendimento"
              >
                {formatDateTime(contact.inicio_atendimento)}
              </Field>

              <Field
                icon={<MessageSquareText className="h-3.5 w-3.5" />}
                label="Última mensagem"
              >
                {formatDateTime(contact.ultima_mensagem_lead)}
              </Field>

              <Field label="Motivo do contato" className="col-span-2">
                {displayText(contact.motivo_contato)}
              </Field>

              <Field
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="Procedimento de interesse"
                className="col-span-2"
              >
                {displayText(contact.procedimento_interesse)}
              </Field>

              <Field
                icon={<CalendarCheck className="h-3.5 w-3.5" />}
                label="Data do agendamento"
              >
                {contact.data_agendamento ? (
                  formatDateTime(contact.data_agendamento)
                ) : (
                  <span className="text-muted">Sem agendamento</span>
                )}
              </Field>

              <Field label="Identificador do agendamento">
                {displayText(contact.id_agendamento)}
              </Field>

              <Field
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Follow-up 1"
              >
                {formatDateTime(contact.follow_up_1)}
              </Field>

              <Field
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Follow-up 2"
              >
                {formatDateTime(contact.follow_up_2)}
              </Field>

              <div className="col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Resumo da conversa
                </p>
                <div className="max-h-56 overflow-y-auto rounded-lg bg-neutral p-4 scrollbar-slim">
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted">
                    {displayText(contact.resumo_conversa)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function WhatsappLink({ value }: { value: string | null }) {
  const href = whatsappHref(value)

  if (!href || !hasText(value)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Phone className="h-3.5 w-3.5" />
        —
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
    >
      <Phone className="h-3.5 w-3.5" />
      {formatWhatsapp(value)}
    </a>
  )
}

function Field({
  label,
  icon,
  children,
  className,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-relaxed text-ink">{children}</p>
    </div>
  )
}
