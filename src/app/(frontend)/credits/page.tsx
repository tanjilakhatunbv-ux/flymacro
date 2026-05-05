import type { Metadata } from 'next'
import { getCurrentUser } from '../../../lib/auth'
import { getPayload } from '../../../lib/payload'
import { CreditPackages } from '../../../components/CreditPackages'
import type { CreditPackage } from '../../../payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '充值积分 — FlyMacro',
}

export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await getCurrentUser()
  const sp = await searchParams
  const paidStatus = sp.paid

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'credit-packages',
    where: { enabled: { equals: true } },
    sort: 'sort',
    limit: 10,
    depth: 0,
  })
  const packages = r.docs as CreditPackage[]

  return (
    <div className="container-page page-single">
      <h1>充值积分</h1>
      <p className="lead">
        {user ? (
          <>
            当前积分：<strong style={{ color: 'var(--gold-bright)' }}>{(user.credits as number) ?? 0}</strong>
          </>
        ) : (
          '登录后即可充值积分，兑换宏使用权。'
        )}
      </p>

      {paidStatus === 'success' && (
        <div className="auth-success" role="status" style={{ marginBottom: '1.5rem' }}>
          充值成功！积分已到账。请刷新页面查看最新余额。
        </div>
      )}
      {paidStatus === 'cancel' && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          充值已取消。如有问题请联系客服。
        </div>
      )}

      <CreditPackages packages={packages} loggedIn={!!user} />

      <section style={{ marginTop: '2.5rem', padding: '1.25rem', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)', marginBottom: '0.75rem' }}>
          充值须知
        </h3>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
          <li>1 元人民币 = 1 积分，充值后立即到账。</li>
          <li>积分<strong>仅用于兑换宏使用权，不支持提现或退款</strong>。</li>
          <li>兑换后的宏在有效期内可无限次查看代码，过期后需重新兑换或续费。</li>
          <li>常规宏兑换后<strong>永久有效</strong>，高级宏默认有效期 30 天，支持自动续费。</li>
          <li>如遇支付问题，请通过工单系统联系客服处理。</li>
        </ul>
      </section>
    </div>
  )
}
