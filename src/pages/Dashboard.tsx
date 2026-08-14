import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from 'date-fns'
import { ArrowRight, CalendarCheck, Users } from 'lucide-react'

import { ContactModal } from '@/components/ContactModal'
import { ContactsTable } from '@/components/ContactsTable'
import { FilterBar } from '@/components/FilterBar'
import { PageHeader } from '@/components/Layout'
import { StatCard } from '@/components/StatCard'
import { AgendamentosFuturos } from '@/components/charts/AgendamentosFuturos'
import { AtendimentosPorDia } from '@/components/charts/AtendimentosPorDia'
import { AtendimentosPorDiaSemana } from '@/components/charts/AtendimentosPorDiaSemana'
import { ChartCard } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchAppointmentDatesInRange } from '@/lib/appointments'
import {
  buildDailySeries,
  buildUpcomingSeries,
  buildWeekdaySeries,
} from '@/lib/aggregate'
import { toDateKey } from '@/lib/format'
import { describePeriod, makePeriod, type Period } from '@/lib/periods'
import {
  fetchAtendimentoTimestamps,
  fetchPeriodCounts,
  fetchRecentContacts,
} from '@/lib/queries'
import type { Contact } from '@/lib/types'

const UPCOMING_DAYS = 14

export default function Dashboard() {
  // Filtro padrao do Dashboard: ultimos 7 dias.
  const [period, setPeriod] = useState<Period>(() => makePeriod('ultimos7'))
  const [selected, setSelected] = useState<Contact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  /* Os graficos paginam ate 23 mil linhas, entao terminam depois dos cards. */
  const [chartsLoading, setChartsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    totalContatos: 0,
    totalAgendamentos: 0,
  })
  const [timestamps, setTimestamps] = useState<string[]>([])
  const [recent, setRecent] = useState<Contact[]>([])

  // Grafico 3 tem ciclo de vida proprio: nao depende do filtro de periodo.
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [upcoming, setUpcoming] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setChartsLoading(true)
      setError(null)

      try {
        // As contagens vem primeiro: o total exato deixa a paginacao dos
        // graficos disparar todas as paginas em paralelo.
        const [periodCounts, recentContacts] = await Promise.all([
          fetchPeriodCounts(period),
          fetchRecentContacts(period, 10),
        ])

        if (cancelled) return
        setCounts(periodCounts)
        setRecent(recentContacts)
        // Cards e lista ja podem sair do skeleton.
        setLoading(false)

        const chartSource = await fetchAtendimentoTimestamps(
          period,
          periodCounts.totalContatos,
        )

        if (cancelled) return
        setTimestamps(chartSource.timestamps)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Falha ao carregar os dados.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
          setChartsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [period])

  useEffect(() => {
    let cancelled = false

    async function loadUpcoming() {
      setUpcomingLoading(true)
      try {
        const today = new Date()
        // 14 dias incluindo hoje: hoje ate hoje+13.
        const rows = await fetchAppointmentDatesInRange(
          toDateKey(today),
          toDateKey(addDays(today, UPCOMING_DAYS - 1)),
        )
        if (!cancelled) setUpcoming(rows)
      } catch {
        if (!cancelled) setUpcoming([])
      } finally {
        if (!cancelled) setUpcomingLoading(false)
      }
    }

    loadUpcoming()
    return () => {
      cancelled = true
    }
  }, [])

  const dailySeries = useMemo(
    () => buildDailySeries(timestamps, period),
    [timestamps, period],
  )
  const weekdaySeries = useMemo(
    () => buildWeekdaySeries(timestamps),
    [timestamps],
  )
  // As barras comecam HOJE: a busca ja traz `data_agendamento >= hoje`.
  const upcomingSeries = useMemo(
    () => buildUpcomingSeries(upcoming, new Date(), UPCOMING_DAYS),
    [upcoming],
  )

  function openContact(contact: Contact) {
    setSelected(contact)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Visão geral dos atendimentos · ${describePeriod(period)}`}
      />

      <div className="mb-6">
        <FilterBar value={period} onChange={setPeriod} />
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Não foi possível carregar os dados
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-5">
        <StatCard
          label="Total de Contatos"
          value={counts.totalContatos}
          hint="contatos no período"
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Agendamentos"
          value={counts.totalAgendamentos}
          hint="agendamentos realizados"
          icon={CalendarCheck}
          tone="positive"
          loading={loading}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <ChartCard
          title="Atendimentos por dia"
          subtitle={describePeriod(period)}
          loading={chartsLoading}
          isEmpty={timestamps.length === 0}
        >
          <AtendimentosPorDia data={dailySeries} />
        </ChartCard>

        <ChartCard
          title="Atendimentos por dia da semana"
          subtitle="Distribuição no período filtrado"
          loading={chartsLoading}
          isEmpty={timestamps.length === 0}
        >
          <AtendimentosPorDiaSemana data={weekdaySeries} />
        </ChartCard>
      </div>

      <div className="mb-6">
        <ChartCard
          title="Agendamentos futuros"
          subtitle={`Próximos ${UPCOMING_DAYS} dias · não segue o filtro de período`}
          loading={upcomingLoading}
          isEmpty={upcoming.length === 0}
          emptyMessage="Nenhum agendamento nos próximos 14 dias"
        >
          <AgendamentosFuturos data={upcomingSeries} />
        </ChartCard>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Contatos recentes
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Os 10 atendimentos mais recentes do período
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/contatos">
              Ver todos os contatos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ContactsTable
          contacts={recent}
          loading={loading}
          onSelect={openContact}
        />
      </Card>

      <ContactModal
        contact={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
