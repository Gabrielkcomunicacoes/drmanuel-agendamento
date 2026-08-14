import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  PERIOD_PRESETS,
  describePeriod,
  makeCustomPeriod,
  makePeriod,
  type Period,
  type PeriodPresetId,
} from '@/lib/periods'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  value: Period
  onChange: (period: Period) => void
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>({
    from: value.start,
    to: value.end,
  })

  // Reabrir o calendario deve refletir o intervalo que esta ativo no momento.
  useEffect(() => {
    if (open) setDraft({ from: value.start, to: value.end })
  }, [open, value.start, value.end])

  function handlePreset(preset: PeriodPresetId) {
    if (preset === 'personalizado') {
      setOpen(true)
      return
    }
    onChange(makePeriod(preset))
  }

  function applyCustom() {
    if (!draft?.from) return
    // Um unico dia selecionado vale como intervalo fechado nesse mesmo dia.
    onChange(makeCustomPeriod(draft.from, draft.to ?? draft.from))
    setOpen(false)
  }

  const isCustom = value.preset === 'personalizado'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIOD_PRESETS.map((preset) => {
        const active = value.preset === preset.id

        if (preset.id === 'personalizado') {
          return (
            <Popover key={preset.id} open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-pressed={active}
                  className={cn(pillClass(active), 'gap-1.5')}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isCustom ? describePeriod(value) : preset.label}
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-auto p-3">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  defaultMonth={value.start}
                  selected={draft}
                  onSelect={setDraft}
                  /* Datas futuras bloqueadas, conforme a spec. */
                  disabled={{ after: new Date() }}
                />

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-hairline pt-3">
                  <p className="text-xs text-muted">
                    {draft?.from
                      ? describePeriod(
                          makeCustomPeriod(draft.from, draft.to ?? draft.from),
                        )
                      : 'Selecione a data inicial'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={!draft?.from}
                      onClick={applyCustom}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        }

        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={active}
            onClick={() => handlePreset(preset.id)}
            className={pillClass(active)}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}

function pillClass(active: boolean) {
  return cn(
    'inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    active
      ? 'border-brand bg-brand-soft text-brand'
      : 'border-hairline bg-white text-muted hover:border-slate-300 hover:text-ink',
  )
}
