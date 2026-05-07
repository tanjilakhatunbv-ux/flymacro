import type { Metadata } from 'next'
import { getCurrentUser } from '../../../lib/auth'
import { getPayload } from '../../../lib/payload'
import { CreditPackages } from '../../../components/CreditPackages'
import { RichText } from '../../../components/RichText'
import type { CreditPackage, SiteSetting } from '../../../payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '充值积分 — FlyMacro',
}

export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await getCurrentUser()
  const sp = await searchParams
  const paidStatus = sp.paid

  const payload = await getPayload()

  const [pkgResult, settingsResult] = await Promise.all([
    payload.find({
      collection: 'credit-packages',
      where: { enabled: { equals: true } },
      sort: 'sort',
      limit: 10,
      depth: 0,
    }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])

  const packages = pkgResult.docs as CreditPackage[]
  const creditPage = (settingsResult as SiteSetting | null)?.creditPage ?? {}

  const pageTitle = creditPage.title || '充值积分'
  const pageSubtitle = creditPage.subtitle || (user
    ? `当前积分：${(user.credits as number) ?? 0}`
    : '登录后即可充值积分，兑换宏使用权。')
  const promoEnabled = creditPage.promoEnabled === true
  const promoBanner = creditPage.promoBanner || ''
  const noticeEnabled = creditPage.noticeEnabled !== false
  const customNotice = creditPage.notice

  return (
    <div className="container-page page-single">
      <h1>{pageTitle}</h1>
      <p className="lead">
        {user ? (
          <>
            {pageSubtitle.replace(/\{credits\}/g, String((user.credits as number) ?? 0))}
            {!pageSubtitle.includes('积分') && (
              <>
                {' '}当前积分：
                <strong style={{ color: 'var(--gold-bright)' }}>{(user.credits as number) ?? 0}</strong>
              </>
            )}
          </>
        ) : (
          pageSubtitle
        )}
      </p>

      {promoEnabled && promoBanner && (
        <div className="promo-banner" role="alert">
          {promoBanner}
        </div>
      )}

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

      {noticeEnabled && (
        <section className="credit-notice">
          <h3>充值须知</h3>
          {customNotice ? (
            <div className="credit-notice-body">
              <RichText content={customNotice} />
            </div>
          ) : (
            <ul>
              <li>1 元人民币 = 1 积分，充值后立即到账。</li>
              <li>积分<strong>仅用于兑换宏使用权，不支持提现或退款</strong>。</li>
              <li>兑换后的宏在有效期内可无限次查看代码，过期后需重新兑换或续费。</li>
              <li>常规宏兑换后<strong>永久有效</strong>，高级宏默认有效期 30 天，支持自动续费。</li>
              <li>如遇支付问题，请通过工单系统联系客服处理。</li>
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
