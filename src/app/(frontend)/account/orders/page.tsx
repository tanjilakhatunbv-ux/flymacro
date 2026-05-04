import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import type { CreditOrder } from '../../../../payload-types'

export const metadata: Metadata = {
  title: '充值记录 — FlyMacro',
}

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'credit-orders',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const orders = r.docs as CreditOrder[]

  return (
    <>
      <h1>充值记录</h1>
      <p className="lead">查看你的所有充值订单及积分到账情况。</p>

      {orders.length === 0 ? (
        <div className="account-empty">
          <p>你还没有任何充值记录。</p>
          <Link href="/account/credits" className="btn btn-primary">
            去充值
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {orders.map((o) => (
            <div key={o.id} className="ticket-list-item">
              <div className="row">
                <span className="ticket-subject">订单 {o.orderNumber}</span>
                <span className="status-pill" data-status={o.status}>
                  {statusLabel(o.status)}
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  支付 {formatPrice(o.amount, o.currency)}
                </span>
                <span className="ticket-meta" style={{ color: 'var(--gold-bright)', fontWeight: 500 }}>
                  +{o.creditsGranted} 积分
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  创建于 {formatDate(o.createdAt)}
                </span>
                {o.paidAt && (
                  <span className="ticket-meta">
                    支付于 {formatDate(o.paidAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function statusLabel(s: string): string {
  return (
    {
      pending: '待支付',
      paid: '已支付',
      failed: '失败',
    } as Record<string, string>
  )[s] ?? s
}

function formatPrice(amount: number, currency: 'CNY' | 'USD'): string {
  if (currency === 'CNY') return `¥${amount.toFixed(2)}`
  return `$${amount.toFixed(2)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
