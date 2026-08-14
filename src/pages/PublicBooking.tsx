import { useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay } from 'date-fns'
import { CalendarIcon, CheckCircle2, Flower2 } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchSlotCounts, insertAppointment } from '@/lib/appointments'
import {
  countDigits,
  formatDateExtenso,
  formatDateOnly,
  formatHorario,
  maskWhatsappInput,
  toDateKey,
} from '@/lib/format'
import { getHorariosDoDia, isDiaFechado } from '@/lib/horarios'
import { PROCEDIMENTOS } from '@/lib/procedimentos'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface FormErrors {
  nome?: string
  whatsapp?: string
  procedimento?: string
  data?: string
  horario?: string
}

interface Confirmation {
  nome: string
  procedimento: string
  dateKey: string
  horario: string
}

/**
 * Calculada a cada chamada, nunca guardada em constante de modulo — a pagina
 * publica pode ficar aberta numa aba por horas, e uma constante fixada no
 * carregamento congelaria "amanha" no dia em que a pagina foi aberta.
 */
function getTomorrow(): Date {
  return startOfDay(addDays(new Date(), 1))
}

export default function PublicBooking() {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [procedimento, setProcedimento] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedHorario, setSelectedHorario] = useState<string | undefined>()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({})
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const horariosDoDia = useMemo(
    () => (selectedDate ? getHorariosDoDia(selectedDate) : []),
    [selectedDate],
  )

  // Carrega disponibilidade da data escolhida e assina o Realtime dela.
  useEffect(() => {
    setSelectedHorario(undefined)

    if (!selectedDate) {
      setSlotCounts({})
      return
    }

    let cancelled = false
    const dateKey = toDateKey(selectedDate)

    async function carregarDisponibilidade() {
      setSlotsLoading(true)
      try {
        const counts = await fetchSlotCounts(dateKey)
        if (!cancelled) setSlotCounts(counts)
      } catch {
        if (!cancelled) setSlotCounts({})
      } finally {
        if (!cancelled) setSlotsLoading(false)
      }
    }

    carregarDisponibilidade()

    const channel = supabase
      .channel(`disponibilidade-${dateKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agendamentos',
          filter: `data_agendamento=eq.${dateKey}`,
        },
        () => carregarDisponibilidade(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [selectedDate])

  function validate(): boolean {
    const next: FormErrors = {}

    if (!nome.trim()) next.nome = 'Informe o nome completo'
    if (countDigits(whatsapp) < 10) next.whatsapp = 'Informe um WhatsApp válido'
    if (!procedimento) next.procedimento = 'Selecione um procedimento'

    if (!selectedDate) {
      next.data = 'Selecione uma data'
    } else if (isDiaFechado(selectedDate)) {
      next.data = 'A clínica não atende aos domingos'
    } else if (startOfDay(selectedDate) < getTomorrow()) {
      next.data = 'Escolha uma data a partir de amanhã'
    }

    if (!selectedHorario) {
      next.horario = 'Selecione um horário'
    } else if ((slotCounts[selectedHorario] ?? 0) >= 1) {
      next.horario = 'Esse horário não está mais disponível'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function resetForm() {
    setNome('')
    setWhatsapp('')
    setProcedimento('')
    setSelectedDate(undefined)
    setSelectedHorario(undefined)
    setErrors({})
    setSubmitError(null)
    setConfirmation(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    if (!validate() || !selectedDate || !selectedHorario) return

    setSubmitting(true)
    const dateKey = toDateKey(selectedDate)

    try {
      // Revalida contra o banco na hora do envio — evita dois leads
      // reservando o mesmo horario na janela entre a selecao e o clique.
      const freshCounts = await fetchSlotCounts(dateKey)
      if ((freshCounts[selectedHorario] ?? 0) >= 1) {
        setSlotCounts(freshCounts)
        setSelectedHorario(undefined)
        setErrors((prev) => ({
          ...prev,
          horario: 'Esse horário acabou de ser preenchido. Escolha outro.',
        }))
        return
      }

      await insertAppointment({
        nome: nome.trim(),
        // Prefixo 55 para casar com o padrao ja usado em crm_estetica.whatsapp_lead
        // e para o link wa.me da pagina interna funcionar sem tratamento extra.
        whatsapp: `55${whatsapp.replace(/\D/g, '')}`,
        procedimento,
        data_agendamento: dateKey,
        horario: selectedHorario,
      })

      setConfirmation({
        nome: nome.trim(),
        procedimento,
        dateKey,
        horario: selectedHorario,
      })
      // Zera a data selecionada para o efeito de disponibilidade desmontar o
      // canal do Realtime — a grade nao aparece mais na tela de confirmacao.
      setSelectedDate(undefined)
    } catch {
      setSubmitError(
        'Não foi possível confirmar o agendamento. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[480px]">
        <header className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Flower2 className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="text-xl font-semibold text-ink">
            Clínica do Dr. Manuel
          </h1>
          <p className="mt-1 text-sm text-muted">Agende seu procedimento</p>
        </header>

        <div className="rounded-xl border border-hairline bg-white p-6 shadow-card sm:p-7">
          {confirmation ? (
            <ConfirmationView
              confirmation={confirmation}
              onReset={resetForm}
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {submitError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <Field label="Nome completo" htmlFor="nome" error={errors.nome}>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Seu nome completo"
                  className={inputClass(Boolean(errors.nome))}
                  autoComplete="name"
                />
              </Field>

              <Field
                label="WhatsApp"
                htmlFor="whatsapp"
                error={errors.whatsapp}
              >
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(event) =>
                    setWhatsapp(maskWhatsappInput(event.target.value))
                  }
                  placeholder="(00) 00000-0000"
                  className={inputClass(Boolean(errors.whatsapp))}
                  autoComplete="tel"
                />
              </Field>

              <Field
                label="Procedimento"
                htmlFor="procedimento"
                error={errors.procedimento}
              >
                <select
                  id="procedimento"
                  value={procedimento}
                  onChange={(event) => setProcedimento(event.target.value)}
                  className={cn(inputClass(Boolean(errors.procedimento)), 'appearance-none')}
                >
                  <option value="" disabled>
                    Selecione um procedimento
                  </option>
                  {PROCEDIMENTOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Data" htmlFor="data" error={errors.data}>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id="data"
                      type="button"
                      className={cn(
                        inputClass(Boolean(errors.data)),
                        'flex items-center justify-between text-left',
                        !selectedDate && 'text-muted',
                      )}
                    >
                      {selectedDate ? formatDateOnly(toDateKey(selectedDate)) : 'Selecione uma data'}
                      <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      defaultMonth={selectedDate ?? getTomorrow()}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setDatePickerOpen(false)
                      }}
                      disabled={[{ before: getTomorrow() }, { dayOfWeek: [0] }]}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field label="Horário" htmlFor="horario" error={errors.horario}>
                <HorarioGrid
                  date={selectedDate}
                  horarios={horariosDoDia}
                  counts={slotCounts}
                  loading={slotsLoading}
                  selected={selectedHorario}
                  onSelect={setSelectedHorario}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-base font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'h-12 w-full rounded-lg border bg-white px-3.5 text-[15px] text-ink transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    hasError
      ? 'border-negative focus:ring-negative'
      : 'border-hairline focus:ring-brand',
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </div>
  )
}

function HorarioGrid({
  date,
  horarios,
  counts,
  loading,
  selected,
  onSelect,
}: {
  date: Date | undefined
  horarios: string[]
  counts: Record<string, number>
  loading: boolean
  selected: string | undefined
  onSelect: (horario: string) => void
}) {
  if (!date) {
    return (
      <p className="rounded-lg border border-dashed border-hairline px-3.5 py-3 text-sm text-muted">
        Selecione uma data para ver os horários disponíveis
      </p>
    )
  }

  if (horarios.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-hairline px-3.5 py-3 text-sm text-muted">
        A clínica não atende aos domingos
      </p>
    )
  }

  if (loading) {
    return (
      <p className="rounded-lg border border-dashed border-hairline px-3.5 py-3 text-sm text-muted">
        Carregando horários…
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {horarios.map((horario) => {
        const lotado = (counts[horario] ?? 0) >= 1
        const isSelected = selected === horario

        return (
          <button
            key={horario}
            type="button"
            disabled={lotado}
            onClick={() => onSelect(horario)}
            className={cn(
              'flex h-12 flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors',
              lotado &&
                'cursor-not-allowed border border-hairline bg-neutral text-muted/70',
              !lotado &&
                !isSelected &&
                'border border-brand bg-white text-brand hover:bg-brand-soft',
              isSelected && 'border border-brand bg-brand text-white',
            )}
          >
            <span className={lotado ? 'line-through' : undefined}>
              {horario}
            </span>
            {lotado && <span className="text-[10px] leading-none">Lotado</span>}
          </button>
        )
      })}
    </div>
  )
}

function ConfirmationView({
  confirmation,
  onReset,
}: {
  confirmation: Confirmation
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <CheckCircle2
        className="h-16 w-16 text-positive"
        strokeWidth={1.5}
      />
      <h2 className="mt-4 text-xl font-semibold text-ink">
        Agendamento confirmado!
      </h2>

      <div className="mt-5 w-full space-y-2 rounded-lg bg-neutral p-4 text-left text-sm">
        <p>
          <span className="text-muted">Nome: </span>
          <span className="font-medium text-ink">{confirmation.nome}</span>
        </p>
        <p>
          <span className="text-muted">Procedimento: </span>
          <span className="font-medium text-ink">
            {confirmation.procedimento}
          </span>
        </p>
        <p>
          <span className="text-muted">Data: </span>
          <span className="font-medium capitalize text-ink">
            {formatDateExtenso(confirmation.dateKey)}
          </span>
        </p>
        <p>
          <span className="text-muted">Horário: </span>
          <span className="font-medium text-ink">
            {formatHorario(confirmation.horario)}
          </span>
        </p>
      </div>

      <p className="mt-5 text-sm text-muted">
        Em breve nossa equipe entrará em contato pelo WhatsApp para confirmar.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-brand text-base font-semibold text-white transition-colors hover:bg-blue-600"
      >
        Fazer novo agendamento
      </button>
    </div>
  )
}
