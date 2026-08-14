import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { ContactModal } from '@/components/ContactModal'
import { ContactsTable } from '@/components/ContactsTable'
import { FilterBar } from '@/components/FilterBar'
import { PageHeader } from '@/components/Layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { describePeriod, makePeriod, type Period } from '@/lib/periods'
import { CONTACTS_ROW_CAP, fetchContacts } from '@/lib/queries'
import type { Contact } from '@/lib/types'

export default function Contacts() {
  // Filtro padrao da pagina de Contatos: este mes.
  const [period, setPeriod] = useState<Period>(() => makePeriod('este_mes'))
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [capped, setCapped] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const page = await fetchContacts(period)
        if (cancelled) return
        setContacts(page.contacts)
        setTotal(page.total)
        setCapped(page.capped)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Falha ao carregar os contatos.',
        )
        setContacts([])
        setTotal(0)
        setCapped(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [period])

  /* Busca local por nome ou WhatsApp — sem nova query, conforme a spec. */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return contacts

    const digits = term.replace(/\D/g, '')

    return contacts.filter((contact) => {
      const name = contact.nome_lead?.toLowerCase() ?? ''
      if (name.includes(term)) return true

      if (digits.length > 0) {
        const phone = contact.whatsapp_lead?.replace(/\D/g, '') ?? ''
        if (phone.includes(digits)) return true
      }

      return false
    })
  }, [contacts, search])

  function openContact(contact: Contact) {
    setSelected(contact)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle={`Todos os leads que entraram em contato · ${describePeriod(period)}`}
      />

      <div className="mb-6">
        <FilterBar value={period} onChange={setPeriod} />
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Não foi possível carregar os contatos
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-6 border-b border-hairline px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou WhatsApp"
              className="pl-9"
              aria-label="Buscar contatos por nome ou WhatsApp"
            />
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-ink">
              {loading
                ? 'Carregando…'
                : `Exibindo ${filtered.length.toLocaleString('pt-BR')} ${
                    filtered.length === 1 ? 'contato' : 'contatos'
                  }`}
            </p>
            {!loading && capped && (
              <p className="mt-0.5 text-xs text-muted">
                de {total.toLocaleString('pt-BR')} no período · limite de{' '}
                {CONTACTS_ROW_CAP.toLocaleString('pt-BR')} por carga, refine o
                período
              </p>
            )}
          </div>
        </div>

        <ContactsTable
          contacts={filtered}
          loading={loading}
          onSelect={openContact}
          stickyHeader
          skeletonRows={10}
          emptyMessage={
            search.trim()
              ? 'Nenhum contato corresponde à busca'
              : 'Nenhum contato encontrado neste período'
          }
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
