'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { CreditPackage } from '../payload-types'
import { getApiErrorMessage } from '../lib/api-errors'

export function CreditPackages({ packages, loggedIn }: { packages: CreditPackage[]; loggedIn: boolean }) {
  const t = useTranslations('creditPackages')
  const [pendingId, setPendingId] = useState<number | string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCheckout(pkg: CreditPackage) {
    if (!loggedIn) return
    setError(null)
    setPendingId(pkg.id)
    startTransition(async () => {
      try {
        const resp = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ packageId: pkg.id }),
        })
        const data = (await resp.json()) as { success?: boolean; data?: { checkoutUrl?: string }; error?: string; code?: string; message?: string }
        if (!resp.ok || !data.success) {
          setError(getApiErrorMessage({ success: false, error: data.error || data.message || '', code: data.code || '' }, t))
          setPendingId(null)
          return
        }
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl
        } else {
          setError(t('noPaymentLink'))
          setPendingId(null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t('requestFailed'))
        setPendingId(null)
      }
    })
  }

  if (packages.length === 0) {
    return (
      <div className="account-empty">
        <p>{t('empty')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="models">
        {packages.map((pkg) => {
          const original = pkg.originalAmount
          const discount = discountLabel(pkg.discountLabel, t)
          const badge = pkg.badge
          const hasOriginal = original && original > (pkg.amount ?? 0)
          const packageLabel = t('packLabel', { amount: pkg.creditsGranted })

          return (
            <div key={pkg.id} className={`model-card ${badge && badge !== 'none' ? `badge-${badge}` : ''}`}>
              {badge && badge !== 'none' && (
                <span className="package-badge">{badgeLabel(badge, t)}</span>
              )}
              <div className="model-header">
                <h4>{packageLabel}</h4>
                <div className="price-row">
                  {hasOriginal && (
                    <span className="original-price">¥{original}</span>
                  )}
                  <span className="model-price">¥{pkg.amount}</span>
                </div>
              </div>
              <div className="credit-granted-row">
                {t('creditsAmount', { amount: pkg.creditsGranted })}
                {pkg.creditsGranted > (pkg.amount ?? 0) && (
                  <span className="credit-bonus">
                    {t('bonusCredits', { amount: pkg.creditsGranted - (pkg.amount ?? 0) })}
                  </span>
                )}
              </div>
              {discount && (
                <div className="discount-label">{discount}</div>
              )}
              <div className="model-actions">
                {loggedIn ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleCheckout(pkg)}
                    disabled={isPending && pendingId === pkg.id}
                  >
                    {isPending && pendingId === pkg.id ? t('preparing') : t('buyNow')}
                  </button>
                ) : (
                  <Link href="/auth?mode=login&return=/account/credits" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                    {t('loginRequired')}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {error && (
        <p className="auth-field-err" style={{ marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function badgeLabel(badge: string, t: any): string {
  switch (badge) {
    case 'hot': return t('hot')
    case 'recommended': return t('recommended')
    case 'new': return t('newTag')
    default: return ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function discountLabel(label: string | null | undefined, t: any): string {
  switch (label) {
    case '限时特惠': return t('limitedOffer')
    case '最超值': return t('bestValue')
    case 'VIP专享': return t('vipOnly')
    default: return label ?? ''
  }
}
