'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { CreditPackage } from '../payload-types'

export function CreditPackages({ packages, loggedIn }: { packages: CreditPackage[]; loggedIn: boolean }) {
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
        const data = (await resp.json()) as { success?: boolean; data?: { checkoutUrl?: string }; error?: string; message?: string }
        if (!resp.ok || !data.success) {
          setError(data.error || data.message || '创建支付会话失败')
          setPendingId(null)
          return
        }
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl
        } else {
          setError('未获得支付链接')
          setPendingId(null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '请求失败')
        setPendingId(null)
      }
    })
  }

  if (packages.length === 0) {
    return (
      <div className="account-empty">
        <p>暂无可用充值档次。</p>
      </div>
    )
  }

  return (
    <>
      <div className="models">
        {packages.map((pkg) => {
          const original = pkg.originalAmount
          const discount = pkg.discountLabel
          const badge = pkg.badge
          const hasOriginal = original && original > (pkg.amount ?? 0)

          return (
            <div key={pkg.id} className={`model-card ${badge && badge !== 'none' ? `badge-${badge}` : ''}`}>
              {badge && badge !== 'none' && (
                <span className="package-badge">{badgeLabel(badge)}</span>
              )}
              <div className="model-header">
                <h4>{pkg.label}</h4>
                <div className="price-row">
                  {hasOriginal && (
                    <span className="original-price">¥{original}</span>
                  )}
                  <span className="model-price">¥{pkg.amount}</span>
                </div>
              </div>
              <div className="credit-granted-row">
                到账 <strong>{pkg.creditsGranted}</strong> 积分
                {pkg.creditsGranted > (pkg.amount ?? 0) && (
                  <span className="credit-bonus">
                    （赠 {pkg.creditsGranted - (pkg.amount ?? 0)} 积分）
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
                    {isPending && pendingId === pkg.id ? '准备支付…' : '立即充值'}
                  </button>
                ) : (
                  <Link href="/login?return=/account/credits" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                    登录后充值
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

function badgeLabel(badge: string): string {
  switch (badge) {
    case 'hot': return '热卖'
    case 'recommended': return '推荐'
    case 'new': return '新品'
    default: return ''
  }
}
