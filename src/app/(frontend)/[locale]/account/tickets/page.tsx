import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import type { Ticket } from '../../../../../payload-types'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })
  return { title: t('myTickets') }
}

export default async function TicketsPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'tickets',
    where: { user: { equals: user.id } },
    sort: '-updatedAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const tickets = r.docs as Ticket[]

  return (
    <>
      <h1>{t('myTickets')}</h1>
      <p className="lead">{t('subtitle')}</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Link href="/account/tickets/new" className="btn btn-primary">
          {t('newTicket')}
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="account-empty">
          <p>{t('empty')}</p>
          <Link href="/account/tickets/new" className="btn btn-primary">
            {t('firstTicket')}
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {tickets.map((tk) => (
            <Link key={tk.id} href={`/account/tickets/${tk.id}`} className="ticket-list-item">
              <div className="row">
                <span className="ticket-subject">{tk.subject}</span>
                <span className="status-pill" data-status={tk.status}>
                  {statusLabel(tk.status, t)}
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  {tk.category ? `${categoryLabel(tk.category, t)} · ` : ''}
                  {priorityLabel(tk.priority ?? 'normal', t)}
                </span>
                <span className="ticket-meta">
                  {t('lastUpdate')} {formatDate(tk.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusLabel(s: string, t: any): string {
  return (
    {
      open: t('statusPending'),
      'in-progress': t('statusProcessing'),
      resolved: t('statusResolved'),
      closed: t('statusClosed'),
    } as Record<string, string>
  )[s] ?? s
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function priorityLabel(p: string, t: any): string {
  return ({ low: t('priorityLow'), normal: t('priorityNormal'), high: t('priorityHigh'), urgent: t('priorityUrgent') } as Record<string, string>)[p] ?? p
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function categoryLabel(c: string, t: any): string {
  return (
    {
      refund: t('categoryRefund'),
      usage: t('categoryMacro'),
      account: t('categoryAccount'),
      feedback: t('categoryFeedback'),
      other: t('categoryOther'),
    } as Record<string, string>
  )[c] ?? c
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
