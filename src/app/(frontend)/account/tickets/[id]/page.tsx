import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import { RichText } from '../../../../../components/RichText'
import { TicketReplyForm } from '../../../../../components/TicketForms'
import type { Ticket, TicketMessage } from '../../../../../payload-types'

type Params = Promise<{ id: string }>

export const metadata: Metadata = {
  title: '工单详情 — FlyMacro',
}

export default async function TicketDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()

  let ticket: Ticket | null = null
  try {
    ticket = (await payload.findByID({
      collection: 'tickets',
      id,
      overrideAccess: true,
      depth: 0,
    })) as Ticket | null
  } catch {
    ticket = null
  }
  if (!ticket) notFound()
  const ownerId = typeof ticket.user === 'object' ? ticket.user?.id : ticket.user
  if (String(ownerId) !== String(user.id)) notFound()

  const msgsRes = await payload.find({
    collection: 'ticket-messages',
    where: {
      and: [
        { ticket: { equals: id } },
        { isInternalNote: { not_equals: true } },
      ],
    },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const messages = msgsRes.docs as TicketMessage[]

  return (
    <>
      <div style={{ marginBottom: '0.75rem' }}>
        <Link href="/account/tickets" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          ← 返回工单列表
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            #{ticket.id} · 提交于 {formatDate(ticket.createdAt)}
            {ticket.priority && ticket.priority !== 'normal' ? ` · 优先级：${priorityLabel(ticket.priority)}` : ''}
          </p>
        </div>
        <span className="status-pill" data-status={ticket.status}>
          {statusLabel(ticket.status)}
        </span>
      </div>

      <section className="ticket-thread">
        {messages.length === 0 ? (
          <div className="account-empty">
            <p>这个工单暂无消息记录。</p>
          </div>
        ) : (
          messages.map((m) => (
            <article key={m.id} className="ticket-msg" data-sender={m.senderType}>
              <div className="ticket-msg-head">
                <span>{m.senderType === 'staff' ? '客服' : '你'}</span>
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

function statusLabel(s: string): string {
  return ({ open: '待处理', 'in-progress': '处理中', resolved: '已解决', closed: '已关闭' } as Record<string, string>)[s] ?? s
}
function priorityLabel(p: string): string {
  return ({ low: '低', normal: '普通', high: '高', urgent: '紧急' } as Record<string, string>)[p] ?? p
}
function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
