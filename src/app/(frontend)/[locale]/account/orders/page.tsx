import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { getAccountCreditOrders } from '../../../../../lib/account-data'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orders' })
  return { title: t('title') }
}

export default async function OrdersPage({ params }: { params: Params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orders' })
  const user = await getCurrentUser()
  if (!user) return null

  const orders = await getAccountCreditOrders(user.id)

  return (
    <>
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>

      {orders.length === 0 ? (
        <div className="account-empty">
          <p>{t('empty')}</p>
          <Link href="/account/credits" className="btn btn-primary">
            {t('goBuy')}
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 3 }}>
          {orders.map((o) => (
            <div key={o.id} className="ticket-list-item">
              <div className="row">
                <span className="ticket-subject">{t('orderField')} {o.orderNumber}</span>
                <span className="status-pill" data-status={o.status}>
                  {statusLabel(o.status, t)}
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  {t('paymentField')} {formatPrice(o.amount, o.currency)}
                </span>
                <span className="ticket-meta" style={{ color: 'var(--gold-bright)', fontWeight: 500 }}>
                  +{o.creditsGranted} {t('creditsField')}
                </span>
              </div>
              <div className="row">
                <span className="ticket-meta">
                  {t('createdAt')} {formatDate(o.createdAt)}
                </span>
                {o.paidAt && (
                  <span className="ticket-meta">
                    {t('paidAt')} {formatDate(o.paidAt)}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusLabel(s: string, t: any): string {
  return (
    {
      pending: t('statusPending'),
      paid: t('statusPaid'),
      failed: t('statusFailed'),
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
