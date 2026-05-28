import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../../lib/auth'
import { getAccountTicketDetail } from '../../../../../../lib/ticket-data'
import { RichText } from '../../../../../../components/RichText'
import { BackLink } from '../../../../../../components/BackLink'
import { TicketReplyForm } from '../../../../../../components/TicketForms'

type Params = Promise<{ id: string; locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })
  return { title: t('detailTitle') }
}

export default async function TicketDetailPage({ params }: { params: Params }) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'ticket' })
  const user = await getCurrentUser()
  if (!user) return null

  const detail = await getAccountTicketDetail(user.id, id)
  if (!detail) notFound()
  const { ticket, messages } = detail

  return (
    <>
      <BackLink href="/account/tickets">{t('backToList')}</BackLink>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            #{ticket.id} · {t('submittedAt')} {formatDate(ticket.createdAt)}
            {ticket.priority && ticket.priority !== 'normal' ? ` · ${t('priorityLabel')}：${priorityLabel(ticket.priority, t)}` : ''}
          </p>
        </div>
        <span className="status-pill" data-status={ticket.status}>
          {statusLabel(ticket.status, t)}
        </span>
      </div>

      <section className="ticket-thread">
        {messages.length === 0 ? (
          <div className="account-empty">
            <p>{t('noMessages')}</p>
          </div>
        ) : (
          messages.map((m) => (
            <article key={m.id} className="ticket-msg" data-sender={m.senderType}>
              <div className="ticket-msg-head">
                <span>{m.senderType === 'staff' ? t('supportStaff') : t('you')}</span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
              <div className="ticket-msg-body">
                <RichText content={m.body} />
              </div>
            </article>
          ))
        )}
      </section>

      <TicketReplyForm ticketId={ticket.id} disabled={ticket.status === 'closed'} />
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusLabel(s: string, t: any): string {
  return ({ open: t('statusPending'), 'in-progress': t('statusProcessing'), resolved: t('statusResolved'), closed: t('statusClosed') } as Record<string, string>)[s] ?? s
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function priorityLabel(p: string, t: any): string {
  return ({ low: t('priorityLow'), normal: t('priorityNormal'), high: t('priorityHigh'), urgent: t('priorityUrgent') } as Record<string, string>)[p] ?? p
}
function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
