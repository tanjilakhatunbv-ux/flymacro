import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import { ExchangeRenewButton } from '../../../../../components/ExchangeRenewButton'
import type { MacroExchange } from '../../../../../payload-types'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'exchanges' })
  return { title: t('title') }
}

export default async function ExchangesPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'exchanges' })
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
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>

      {exchanges.length === 0 ? (
        <div className="account-empty">
          <p>{t('empty')}</p>
          <Link href="/macros" className="btn btn-primary">
            {t('goShop')}
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
                      <Link href={`/macros/${encodeURIComponent(macro.slug)}`} style={{ color: 'var(--gold-bright)' }}>
                        {macro.title}
                      </Link>
                    ) : (
                      t('unknownMacro')
                    )}
                  </span>
                  <span className="status-pill" data-status={expired ? 'failed' : 'paid'}>
                    {expired ? t('expired') : e.expiresAt ? t('active') : t('permanent')}
                  </span>
                </div>
                <div className="row">
                  <span className="ticket-meta">
                    {t('costCredits', { credits: e.creditsSpent })}
                  </span>
                  <span className="ticket-meta">
                    {daysLeft !== null
                      ? expired
                        ? t('expired')
                        : t('remaining', { days: daysLeft })
                      : t('permanentValid')}
                    {e.autoRenew && !expired && ` · ${t('autoRenew')}`}
                  </span>
                </div>
                <div className="row">
                  <span className="ticket-meta">
                    {t('exchangedAt')} {formatDate(e.grantedAt ?? e.createdAt)}
                  </span>
                  {e.expiresAt && (
                    <span className="ticket-meta">
                      {t('expiresAt')} {formatDate(e.expiresAt)}
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
