import { useCallback, useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { AppointmentsTable } from '@/components/AppointmentsTable'
import { PageHeader } from '@/components/Layout'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/ui/card'
import {
  fetchUpcomingAppointments,
  fetchUpcomingAppointmentsCount,
  type Appointment,
} from '@/lib/appointments'
import { toDateKey } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export default function Appointments() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    const todayKey = toDateKey(new Date())

    try {
      const [count, list] = await Promise.all([
        fetchUpcomingAppointmentsCount(todayKey),
        fetchUpcomingAppointments(todayKey),
      ])
      setTotal(count)
      setAppointments(list)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar os agendamentos.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('agendamentos-internos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agendamentos' },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return (
    <>
      <PageHeader
        title="Agendamentos"
        subtitle="Próximos agendamentos da clínica"
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Não foi possível carregar os agendamentos
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </Card>
      )}

      <div className="mb-6 max-w-sm">
        <StatCard
          label="Agendamentos"
          value={total}
          hint="agendamentos futuros"
          icon={CalendarDays}
          loading={loading}
        />
      </div>

      <Card>
        <AppointmentsTable appointments={appointments} loading={loading} />
      </Card>
    </>
  )
}
