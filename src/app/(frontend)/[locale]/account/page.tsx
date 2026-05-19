import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'accountPage' })
  return { title: t('title') }
}

export default async function AccountHome({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'accountPage' })
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const [exchanges, creditOrders, openTickets, unreadNotifs] = await Promise.all([
    payload.count({
      collection: 'macro-exchanges',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'credit-orders',
      where: { user: { equals: user.id } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'tickets',
      where: {
        and: [{ user: { equals: user.id } }, { status: { in: ['open', 'in-progress'] } }],
      },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'notifications',
      where: { and: [{ recipient: { equals: user.id } }, { read: { equals: false } }] },
      overrideAccess: true,
    }),
  ])

  const display = user.name || user.email.split('@')[0]
  const verified = (user as { _verified?: boolean })._verified !== false
  const credits = (user.credits as number) ?? 0

  return (
    <>
      <h1>{t('welcome', { name: display })}</h1>
      <p className="lead">{t('subtitle')}</p>

      {!verified && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0 }}>
            {t('emailUnverified')}
          </p>
        </div>
      )}

      <section className="account-summary">
        <div className="account-card">
          <h4>{t('currentCredits')}</h4>
          <div className="num" style={{ color: 'var(--gold-bright)' }}>{credits}</div>
        </div>
        <div className="account-card">
          <h4>{t('exchangedMacros')}</h4>
          <div className="num">{exchanges.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>{t('paymentOrders')}</h4>
          <div className="num">{creditOrders.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>{t('activeTickets')}</h4>
          <div className="num">{openTickets.totalDocs}</div>
        </div>
        <div className="account-card">
          <h4>{t('unreadNotifications')}</h4>
          <div className="num">{unreadNotifs.totalDocs}</div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Link href="/macros" className="btn">
          {t('browseMacros')}
        </Link>
        <Link href="/account/credits" className="btn btn-primary">
          {t('buyCredits')}
        </Link>
        <Link href="/account/tickets/new" className="btn">
          {t('submitTicket')}
        </Link>
        <Link href="/account/exchanges" className="btn">
          {t('viewExchanges')}
        </Link>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-main)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          {t('accountInfo')}
        </h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.6rem', fontSize: '0.92rem' }}>
          <dt style={{ color: 'var(--text-muted)' }}>{t('emailField')}</dt>
          <dd style={{ margin: 0 }}>{user.email}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>{t('nicknameField')}</dt>
          <dd style={{ margin: 0 }}>{user.name || t('notSet')}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>{t('creditsField')}</dt>
          <dd style={{ margin: 0, color: 'var(--gold-bright)' }}>{credits}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>{t('roleField')}</dt>
          <dd style={{ margin: 0 }}>{roleLabel(user.role ?? 'user', t)}</dd>
          <dt style={{ color: 'var(--text-muted)' }}>{t('emailStatus')}</dt>
          <dd style={{ margin: 0 }}>{verified ? t('verified') : t('unverified')}</dd>
        </dl>
      </section>
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roleLabel(role: string, t: any): string {
  switch (role) {
    case 'admin':
      return t('roleAdmin')
    case 'operator':
      return t('roleOperator')
    default:
      return t('roleUser')
  }
}
