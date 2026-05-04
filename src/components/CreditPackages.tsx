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
        const data = (await resp.json()) as { checkoutUrl?: string; error?: string; message?: string }
        if (!resp.ok) {
          setError(data.message || '创建支付会话失败')
          setPendingId(null)
          return
        }
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
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
        {packages.map((pkg) => (
          <div key={pkg.id} className="model-card">
            <div className="model-header">
              <h4>{pkg.label}</h4>
              <span className="model-price">¥{pkg.amount}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-bright)', marginBottom: '0.75rem' }}>
              到账 <strong>{pkg.creditsGranted}</strong> 积分
              {pkg.creditsGranted > pkg.amount && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 6 }}>
                  （赠 {pkg.creditsGranted - pkg.amount} 积分）
                </span>
              )}
            </div>
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
        ))}
      </div>
      {error && (
        <p className="auth-field-err" style={{ marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      )}
    </>
  )
}
