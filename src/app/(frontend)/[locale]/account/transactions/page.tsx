import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import type { CreditTransaction } from '../../../../../payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '积分明细 — FlyMacro',
}

export default async function TransactionsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'credit-transactions',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const transactions = r.docs as CreditTransaction[]

  return (
    <>
      <h1>积分明细</h1>
      <p className="lead">查看每一笔积分变动，包括充值、兑换、续费和注册奖励。</p>

      {transactions.length === 0 ? (
        <div className="account-empty">
          <p>暂无积分变动记录。</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 100px 80px 100px 1fr',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-soft)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            <span>时间</span>
            <span>类型</span>
            <span style={{ textAlign: 'right' }}>变动</span>
            <span style={{ textAlign: 'right' }}>余额</span>
            <span>备注</span>
          </div>
          {transactions.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 100px 80px 100px 1fr',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-soft)',
                fontSize: '0.85rem',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(t.createdAt)}</span>
              <span>{typeLabel(t.type)}</span>
              <span
                style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  color: t.amount > 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {t.amount > 0 ? '+' : ''}
                {t.amount}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{t.balanceAfter}</span>
              <span style={{ color: 'var(--text-muted)' }}>{t.reason || '-'}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    register_bonus: '注册奖励',
    recharge: '充值',
    exchange: '兑换',
    renew: '续费',
    refund: '退款',
    admin_adjust: '系统调整',
  }
  return map[type] ?? type
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
