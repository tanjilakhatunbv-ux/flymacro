import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import { RedeemCodeForm } from '../../../../../components/RedeemCodeForm'
import type { RedeemCodeRedemption } from '../../../../../payload-types'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'redeemCode' })
  return { title: t('title') }
}

export default async function RedeemCodePage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'redeemCode' })
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const result = await payload.find({
    collection: 'redeem-code-redemptions',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })
  const redemptions = result.docs as RedeemCodeRedemption[]

  return (
    <>
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>

      <RedeemCodeForm loggedIn={true} returnPath="/account/redeem" />

      <h2 style={{ marginTop: '2rem' }}>{t('historyTitle')}</h2>
      {redemptions.length === 0 ? (
        <div className="account-empty">
          <p>{t('historyEmpty')}</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {redemptions.map((redemption) => {
            const redeemCode = typeof redemption.redeemCode === 'object'
              ? redemption.redeemCode?.code
              : `#${redemption.redeemCode}`
            return (
              <div key={redemption.id} className="ticket-list-item">
                <div className="row">
                  <span className="ticket-subject">{maskCode(redeemCode ?? '')}</span>
                  <span className="ticket-meta" style={{ color: 'var(--gold-bright)', fontWeight: 600 }}>
                    +{redemption.creditsGranted} {t('creditsField')}
                  </span>
                </div>
                <div className="row">
                  <span className="ticket-meta">
                    {t('redeemedAt')} {formatDate(redemption.createdAt)}
                  </span>
                  <span className="ticket-meta">
                    {t('balanceChange', {
                      before: redemption.balanceBefore,
                      after: redemption.balanceAfter,
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function maskCode(code: string): string {
  if (!code) return '-'
  if (code.length <= 8) return code
  return `${code.slice(0, 4)}-${'*'.repeat(4)}-${code.slice(-4)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
