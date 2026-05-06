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

const SESSION_CACHE_KEY = 'flymacro_session_v2'
const EXCHANGE_CACHE_KEY = (macroId: number | string) => `flymacro_macro_${macroId}_v2`
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function readSessionCache(): { user: { credits: number } | null; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { user: parsed.user, ts: parsed.ts }
  } catch {
    return null
  }
}

function readExchangeCache(macroId: number | string): { status: ExchangeStatus; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(EXCHANGE_CACHE_KEY(macroId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Reject old-format cache without user isolation (v1 caches)
    if (!('cachedUserId' in parsed)) {
      return null
    }
    // Invalidate cache if it belongs to a different user
    const cachedSession = readSessionCache()
    const currentUserId = cachedSession?.user ? (cachedSession.user as any).id : null
    if (parsed.cachedUserId != null && String(parsed.cachedUserId) !== String(currentUserId)) {
      return null
    }
    return { status: parsed, ts: parsed.ts }
  } catch {
    return null
  }
}

function writeExchangeCache(macroId: number | string, status: ExchangeStatus) {
  if (typeof sessionStorage === 'undefined') return
  try {
    const cachedSession = readSessionCache()
    const currentUserId = cachedSession?.user ? (cachedSession.user as any).id : null
    sessionStorage.setItem(
      EXCHANGE_CACHE_KEY(macroId),
      JSON.stringify({ ...status, cachedUserId: currentUserId, ts: Date.now() }),
    )
  } catch {}
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
  const [fetchedCode, setFetchedCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const cachedSession = readSessionCache()
    const sessionValid = cachedSession && Date.now() - cachedSession.ts < CACHE_TTL_MS

    // 1. Start with session cache for immediate optimistic UI
    if (sessionValid && cachedSession.user) {
      setStatus({
        loggedIn: true,
        isStaff: false,
        exchange: null,
        userCredits: (cachedSession.user.credits as number) ?? 0,
      })
      setLoading(false)
    } else if (sessionValid && !cachedSession.user) {
      setStatus({
        loggedIn: false,
        isStaff: false,
        exchange: null,
        userCredits: 0,
      })
      setLoading(false)
    }

    // 2. Merge exchange cache ONLY when we know the current user identity
    if (sessionValid && cachedSession.user) {
      const userCredits = (cachedSession.user.credits as number) ?? 0
      const cachedExchange = readExchangeCache(macroId)
      const exchangeValid = cachedExchange && Date.now() - cachedExchange.ts < CACHE_TTL_MS
      if (exchangeValid && cachedExchange.status.exchange) {
        setStatus((prev) => {
          const base = prev ?? {
            loggedIn: true,
            isStaff: false,
            exchange: null,
            userCredits,
          }
          return {
            ...base,
            exchange: cachedExchange.status.exchange,
            isStaff: cachedExchange.status.isStaff ?? base.isStaff,
          }
        })
      }
    }

    // 3. Always fetch fresh state from server
    fetch(`/api/macro/exchange-status?macroId=${macroId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        if (d && !d.error) {
          const freshStatus: ExchangeStatus = {
            loggedIn: d.loggedIn ?? false,
            isStaff: d.isStaff ?? false,
            exchange: d.exchange ?? null,
            userCredits: d.userCredits ?? 0,
          }
          setStatus(freshStatus)
          writeExchangeCache(macroId, freshStatus)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [macroId])

  // Fetch code content client-side when user has access but SSR didn't provide it
  useEffect(() => {
    if (!status) return
    const hasAccess = status.isStaff || (!!status.exchange && !status.exchange.expired)
    if (hasAccess && !codeContent && !fetchedCode) {
      fetch(`/api/macro/code?macroId=${macroId}`, { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && !d.error && d.code) {
            setFetchedCode(d.code)
          }
        })
        .catch(() => {})
    }
  }, [status, codeContent, fetchedCode, macroId])

  // Default state: not logged in, no exchange
  const effectiveStatus: ExchangeStatus = status ?? {
    loggedIn: false,
    isStaff: false,
    exchange: null,
    userCredits: 0,
  }

  const hasExchanged = !!effectiveStatus.exchange && !effectiveStatus.exchange.expired
  const expired = !!effectiveStatus.exchange?.expired
  const canSeeCode = effectiveStatus.isStaff || hasExchanged

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
          {(codeContent || fetchedCode) ? (
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
            <a href="/guide/how-to-use-macro" className="code-footer-link">
              使用指南
            </a>
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
