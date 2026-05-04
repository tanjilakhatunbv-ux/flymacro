import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import type { Ticket } from '../../../../payload-types'

export const metadata: Metadata = {
  title: '我的工单 — FlyMacro',
}

export default async function TicketsPage() {
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
      <h1>我的工单</h1>
      <p className="lead">在这里查看你提交的所有工单及客服回复进度。</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Link href="/account/tickets/new" className="btn btn-primary">
          提交新工单
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="account-empty">
          <p>你还没有提交过任何工单。</p>
          <Link href="/account/tickets/new" className="btn btn-primary">
            提交第一个工单
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {tickets.map((t) => (
            <Link key={t.id} href={`/account/tickets/${t.id}`} className="ticket-list-item">
              <div className="row">
                <span className="ticket-subject">{t.subject}</span>
                <span className="status-pill" data-status={t.status}>
                  {statusLabel(t.status)}
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  {t.category ? `${categoryLabel(t.category)} · ` : ''}
                  {priorityLabel(t.priority ?? 'normal')}
                </span>
                <span className="ticket-meta">
                  最后更新 {formatDate(t.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function statusLabel(s: string): string {
  return (
    {
      open: '待处理',
      'in-progress': '处理中',
      resolved: '已解决',
      closed: '已关闭',
    } as Record<string, string>
  )[s] ?? s
}
function priorityLabel(p: string): string {
  return ({ low: '低', normal: '普通', high: '高', urgent: '紧急' } as Record<string, string>)[p] ?? p
}
function categoryLabel(c: string): string {
  return (
    {
      refund: '退款申请',
      usage: '宏使用问题',
      account: '账号问题',
      feedback: '建议反馈',
      other: '其他',
    } as Record<string, string>
  )[c] ?? c
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
