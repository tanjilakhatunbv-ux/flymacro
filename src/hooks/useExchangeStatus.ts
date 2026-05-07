'use client'

import { useState, useEffect } from 'react'
import { readSessionCache, isCacheValid } from '../lib/session-cache'

export type ExchangeStatus = {
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

const EXCHANGE_CACHE_KEY = (macroId: number | string) => `flymacro_macro_${macroId}_v2`

function readExchangeCache(
  macroId: number | string,
): { status: ExchangeStatus; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(EXCHANGE_CACHE_KEY(macroId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExchangeStatus & { cachedUserId?: number | string | null; ts: number }
    if (!('cachedUserId' in parsed)) return null
    const cachedSession = readSessionCache()
    const currentUserId = cachedSession?.user?.id ?? null
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
    const currentUserId = cachedSession?.user?.id ?? null
    sessionStorage.setItem(
      EXCHANGE_CACHE_KEY(macroId),
      JSON.stringify({ ...status, cachedUserId: currentUserId, ts: Date.now() }),
    )
  } catch {}
}

export function useExchangeStatus(macroId: number, codeContent?: string | null) {
  const [status, setStatus] = useState<ExchangeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchedCode, setFetchedCode] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const cachedSession = readSessionCache()
    const sessionValid = cachedSession && isCacheValid(cachedSession.ts)

    if (sessionValid && cachedSession.user) {
      const isStaff = ['super-admin', 'operator', 'support'].includes(cachedSession.user.role ?? '')
      setStatus({
        loggedIn: true,
        isStaff,
        exchange: null,
        userCredits: cachedSession.user.credits ?? 0,
      })
      setLoading(false)
    } else if (sessionValid && !cachedSession.user) {
      setStatus({ loggedIn: false, isStaff: false, exchange: null, userCredits: 0 })
      setLoading(false)
    }

    if (sessionValid && cachedSession.user) {
      const userCredits = cachedSession.user.credits ?? 0
      const cachedExchange = readExchangeCache(macroId)
      const exchangeValid = cachedExchange && isCacheValid(cachedExchange.ts)
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

    fetch(`/api/macro/exchange-status?macroId=${macroId}`, { credentials: 'same-origin', signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (signal.aborted) return
        const payload = d.data ?? d
        if (payload && !payload.error) {
          const freshStatus: ExchangeStatus = {
            loggedIn: payload.loggedIn ?? false,
            isStaff: payload.isStaff ?? false,
            exchange: payload.exchange ?? null,
            userCredits: payload.userCredits ?? 0,
          }
          setStatus(freshStatus)
          writeExchangeCache(macroId, freshStatus)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [macroId])

  useEffect(() => {
    if (!status) return
    const hasAccess = status.isStaff || (!!status.exchange && !status.exchange.expired)
    if (!hasAccess || codeContent || fetchedCode) return

    const controller = new AbortController()
    const { signal } = controller

    fetch(`/api/macro/code?macroId=${macroId}`, { credentials: 'same-origin', signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (signal.aborted) return
        const payload = d.data ?? d
        if (payload && !payload.error && payload.code) {
          setFetchedCode(payload.code)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [status, codeContent, fetchedCode, macroId])

  return { status, loading, fetchedCode }
}
