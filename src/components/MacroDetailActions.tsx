'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CodeBlock } from './CodeBlock'
import { ExchangeButton } from './ExchangeButton'

type ExchangeStatus = {
  loggedIn: boolean
  isStaff: boolean
  exchange: {
    id: number | string
    expiresAt: string | null
    autoRenew: boolean
    expired: boolean
  } | null
  userCredits: number
}

export function MacroDetailActions({
  macroId,
  macroSlug,
  macroTitle,
  price,
  durationDays,
  autoRenewable,
  codeContent,
}: {
  macroId: number
  macroSlug: string
  macroTitle: string
  price: number
  durationDays: number
  autoRenewable: boolean
  codeContent: string | null | undefined
}) {
  const [status, setStatus] = useState<ExchangeStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/macro/exchange-status?macroId=${macroId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStatus(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [macroId])

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        加载中…
      </div>
    )
  }

  const hasExchanged = !!status?.exchange && !status.exchange.expired
  const expired = !!status?.exchange?.expired
  const canSeeCode = status?.isStaff || hasExchanged

  return (
    <>
      {hasExchanged && (
        <div className="ownership-banner">
          <span className="ownership-icon">✓</span>
          <span>
            你已兑换此宏
            {status.exchange?.expiresAt
              ? ` · 有效期至 ${status.exchange.expiresAt.slice(0, 10)}`
              : ' · 永久有效'}
            {status.exchange?.autoRenew && ' · 自动续费已开启'}
          </span>
        </div>
      )}

      {expired && (
        <div className="ownership-banner expired">
          <span className="ownership-icon">!</span>
          <span>有效期已过期，请续费后继续使用。</span>
        </div>
      )}

      {canSeeCode && codeContent && (
        <div className="download-area">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', marginBottom: '1.25rem' }}>
            宏命令
          </h3>
          <CodeBlock code={codeContent} language="lua" />
          {status?.exchange?.expiresAt && (
            <p className="hint" style={{ color: expired ? 'var(--text-muted)' : 'var(--gold)' }}>
              {expired
                ? '有效期已过期，请续费后继续使用。'
                : `有效期至 ${status.exchange.expiresAt.slice(0, 10)}`}
              {status.exchange.autoRenew && !expired && ' · 自动续费已开启'}
            </p>
          )}
          <p className="hint">复制全部内容，粘贴到游戏宏编辑器（按 ESC 输入 /macro），保存即可使用。</p>
        </div>
      )}

      {!canSeeCode && (
        <div className="purchase-area">
          <h3>兑换此宏</h3>
          <div className="macro-price-card">
            <div className="model-header">
              <h4>{macroTitle}</h4>
              <span className="model-price">{price} 积分</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {durationDays === 0 ? '永久有效' : `有效期 ${durationDays} 天`}
              {autoRenewable && ' · 支持自动续费'}
            </p>
            <div className="model-actions" style={{ marginTop: '1rem' }}>
              {status?.loggedIn ? (
                <ExchangeButton
                  macroSlug={macroSlug}
                  price={price}
                  userCredits={status.userCredits}
                />
              ) : (
                <Link
                  href={`/login?return=/macros/${macroSlug}`}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'block', textAlign: 'center' }}
                >
                  登录后兑换
                </Link>
              )}
            </div>
          </div>
          <p className="locked-notice">
            积分不足？<Link href="/account/credits" style={{ marginLeft: 4, color: 'var(--gold-bright)' }}>去充值</Link>
          </p>
        </div>
      )}

      {canSeeCode && status?.exchange?.expiresAt && (
        <div className="purchase-area" style={{ marginTop: '1.5rem' }}>
          <h3>续费管理</h3>
          <div className="macro-price-card">
            <div className="model-header">
              <h4>{macroTitle}</h4>
              <span className="model-price">{price} 积分</span>
            </div>
            <div className="model-actions" style={{ marginTop: '0.75rem' }}>
              <ExchangeButton
                macroSlug={macroSlug}
                price={price}
                userCredits={status.userCredits}
                mode="renew"
                exchangeId={status.exchange.id}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
