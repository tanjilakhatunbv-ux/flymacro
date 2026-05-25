import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import type { CreditTransaction } from '../../../../../payload-types'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transactions' })
  return { title: t('title') }
}

export default async function TransactionsPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transactions' })
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
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>

      {transactions.length === 0 ? (
        <div className="account-empty">
          <p>{t('empty')}</p>
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
            <span>{t('timeField')}</span>
            <span>{t('typeField')}</span>
            <span style={{ textAlign: 'right' }}>{t('changeField')}</span>
            <span style={{ textAlign: 'right' }}>{t('balanceField')}</span>
            <span>{t('noteField')}</span>
          </div>
          {transactions.map((tx) => (
            <div
              key={tx.id}
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
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)}</span>
              <span>{typeLabel(tx.type, t)}</span>
              <span
                style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {tx.amount > 0 ? '+' : ''}
                {tx.amount}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{tx.balanceAfter}</span>
              <span style={{ color: 'var(--text-muted)' }}>{tx.reason || '-'}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function typeLabel(type: string, t: any): string {
  const map: Record<string, string> = {
    register_bonus: t('typeSignup'),
    recharge: t('typeTopup'),
    exchange: t('typeExchange'),
    renew: t('typeRenew'),
    redeem_code: t('typeRedeemCode'),
    refund: t('typeRefund'),
    admin_adjust: t('typeAdjust'),
  }
  return map[type] ?? type
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
