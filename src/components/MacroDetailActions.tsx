'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('macroDetail')
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
        <span style={{ color: 'var(--text-muted)' }}>{t('loading')}</span>
      </div>
    )
  }

  return (
    <>
      {hasExchanged && (
        <div className="ownership-banner">
          <span className="ownership-icon">✓</span>
          <span>
            {t('alreadyExchanged')}
            {effectiveStatus.exchange?.expiresAt
              ? ` · ${t('validUntil')} ${effectiveStatus.exchange.expiresAt.slice(0, 10)}`
              : ` · ${t('permanentValid')}`}
            {effectiveStatus.exchange?.autoRenew && ` · ${t('autoRenewOn')}`}
          </span>
        </div>
      )}

      {expired && (
        <div className="ownership-banner expired">
          <span className="ownership-icon">!</span>
          <span>{t('expiredRenew')}</span>
        </div>
      )}

      {canSeeCode && (
        <div className="download-area">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', marginBottom: '1.25rem' }}>
            {t('macroCode')}
          </h3>
          {fetchError ? (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
              {fetchError}，{t('refreshOrContact')}
            </p>
          ) : (codeContent || fetchedCode) ? (
            <CodeBlock code={codeContent || fetchedCode || ''} language="lua" />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('loading')}</p>
          )}
          {effectiveStatus?.exchange?.expiresAt && (
            <p className="hint" style={{ color: expired ? 'var(--text-muted)' : 'var(--gold)' }}>
              {expired
                ? t('expiredRenew')
                : `${t('validUntil')} ${effectiveStatus.exchange.expiresAt.slice(0, 10)}`}
              {effectiveStatus.exchange.autoRenew && !expired && ` · ${t('autoRenewOn')}`}
            </p>
          )}
          <div className="code-footer-bar">
            <span className="code-footer-text">
              {t('copyHint')}
            </span>
            <Link href="/guide/how-to-use-macro" className="code-footer-link">
              {t('usageGuide')}
            </Link>
          </div>
        </div>
      )}

      {!canSeeCode && (
        <div className="purchase-area">
          <h3>{t('exchangeThis')}</h3>
          <div className="macro-price-card">
            <div className="model-header">
              <h4>{macroTitle}</h4>
              <span className="model-price">{t('exchangePrice', { price })}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {durationDays === 0 ? t('permanentValid') : t('validDays', { days: durationDays })}
              {autoRenewable && ` · ${t('supportAutoRenew')}`}
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
                  href={`/auth?mode=login&return=${encodeURIComponent(`/macros/${macroSlug}`)}`}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'block', textAlign: 'center' }}
                >
                  {t('loginToExchange')}
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
            <Link href="/guide/how-to-use-macro" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}>
              {t('usageGuide')}
            </Link>
            <Link href="/account/credits" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}>
              {t('buyCredits')}
            </Link>
          </div>
        </div>
      )}

      {canSeeCode && effectiveStatus?.exchange?.expiresAt && (
        <div className="purchase-area" style={{ marginTop: '1.5rem' }}>
          <h3>{t('renewManage')}</h3>
          <div className="macro-price-card">
            <div className="model-header">
              <h4>{macroTitle}</h4>
              <span className="model-price">{t('exchangePrice', { price })}</span>
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
