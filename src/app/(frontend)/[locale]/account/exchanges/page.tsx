import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import { ExchangeRenewButton } from '../../../../../components/ExchangeRenewButton'
import type { MacroExchange } from '../../../../../payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '我的兑换 — FlyMacro',
}

export default async function ExchangesPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'macro-exchanges',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })
  const exchanges = r.docs as MacroExchange[]

  const now = new Date()

  return (
    <>
      <h1>我的兑换</h1>
      <p className="lead">这里展示你已兑换的宏及有效期，可随时查看代码或续费。</p>

      {exchanges.length === 0 ? (
        <div className="account-empty">
          <p>你还没有兑换过任何宏。</p>
          <Link href="/macros" className="btn btn-primary">
            去宏库选购
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {exchanges.map((e) => {
            const macro = typeof e.macro === 'number' ? null : e.macro
            const expired = e.expiresAt ? new Date(e.expiresAt) <= now : false
            const daysLeft = e.expiresAt
              ? Math.ceil((new Date(e.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div key={e.id} className="ticket-list-item">
                <div className="row">
                  <span className="ticket-subject">
                    {macro ? (
                      <Link href={`/macros/${macro.slug}`} style={{ color: 'var(--gold-bright)' }}>
                        {macro.title}
                      </Link>
                    ) : (
                      '未知宏'
                    )}
                  </span>
                  <span className="status-pill" data-status={expired ? 'failed' : 'paid'}>
                    {expired ? '已过期' : e.expiresAt ? '有效中' : '永久'}
                  </span>
                </div>
                <div className="row">
                  <span className="ticket-meta">
                    花费 {e.creditsSpent} 积分
                  </span>
                  <span className="ticket-meta">
                    {daysLeft !== null
                      ? expired
                        ? '已过期'
                        : `剩余 ${daysLeft} 天`
                      : '永久有效'}
                    {e.autoRenew && !expired && ' · 自动续费'}
                  </span>
                </div>
                <div className="row">
                  <span className="ticket-meta">
                    兑换于 {formatDate(e.grantedAt ?? e.createdAt)}
                  </span>
                  {e.expiresAt && (
                    <span className="ticket-meta">
                      过期于 {formatDate(e.expiresAt)}
                    </span>
                  )}
                </div>
                {e.expiresAt && (
                  <div className="row" style={{ marginTop: '0.5rem' }}>
                    <ExchangeRenewButton
                      exchangeId={e.id}
                      price={e.creditsSpent ?? 0}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function formatDate(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
