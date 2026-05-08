'use client'

import Link from 'next/link'
import { CodeBlock } from './CodeBlock'
import { ExchangeButton } from './ExchangeButton'
import { useExchangeStatus } from '../hooks/useExchangeStatus'

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
  const { status, loading, fetchedCode, fetchError } = useExchangeStatus(macroId, codeContent)

  const effectiveStatus = status ?? {
    loggedIn: false,
    isStaff: false,
    exchange: null,
    userCredits: 0,
  }

  const hasExchanged = !!effectiveStatus.exchange && !effectiveStatus.exchange.expired
  const expired = !!effectiveStatus.exchange?.expired
  const canSeeCode = effectiveStatus.isStaff || hasExchanged

  if (loading) {
    return (
      <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>加载中…</span>
      </div>
    )
  }

  return (
    <>
      {hasExchanged && (
        <div className="ownership-banner">
          <span className="ownership-icon">✓</span>
          <span>
            你已兑换此宏
            {effectiveStatus.exchange?.expiresAt
              ? ` · 有效期至 ${effectiveStatus.exchange.expiresAt.slice(0, 10)}`
              : ' · 永久有效'}
            {effectiveStatus.exchange?.autoRenew && ' · 自动续费已开启'}
          </span>
        </div>
      )}

      {expired && (
        <div className="ownership-banner expired">
          <span className="ownership-icon">!</span>
          <span>有效期已过期，请续费后继续使用。</span>
        </div>
      )}

      {canSeeCode && (
        <div className="download-area">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', marginBottom: '1.25rem' }}>
            宏命令
          </h3>
          {fetchError ? (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
              {fetchError}，请刷新页面重试或联系客服。
            </p>
          ) : (codeContent || fetchedCode) ? (
            <CodeBlock code={codeContent || fetchedCode || ''} language="lua" />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>加载中…</p>
          )}
          {effectiveStatus?.exchange?.expiresAt && (
            <p className="hint" style={{ color: expired ? 'var(--text-muted)' : 'var(--gold)' }}>
              {expired
                ? '有效期已过期，请续费后继续使用。'
                : `有效期至 ${effectiveStatus.exchange.expiresAt.slice(0, 10)}`}
              {effectiveStatus.exchange.autoRenew && !expired && ' · 自动续费已开启'}
            </p>
          )}
          <div className="code-footer-bar">
            <span className="code-footer-text">
              复制全部内容，粘贴到游戏宏编辑器（按 ESC 输入 /macro），保存即可使用。
            </span>
            <Link href="/guide/how-to-use-macro" className="code-footer-link">
              使用指南
            </Link>
          </div>
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
              {effectiveStatus?.loggedIn ? (
                <ExchangeButton
                  macroSlug={macroSlug}
                  price={price}
                  userCredits={effectiveStatus.userCredits}
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
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
            <Link href="/guide/how-to-use-macro" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}>
              使用指南
            </Link>
            <Link href="/account/credits" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}>
              充值积分
            </Link>
          </div>
        </div>
      )}

      {canSeeCode && effectiveStatus?.exchange?.expiresAt && (
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
                userCredits={effectiveStatus.userCredits}
                mode="renew"
                exchangeId={effectiveStatus.exchange.id}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
