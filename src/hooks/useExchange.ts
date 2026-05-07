'use client'

import { useState, useTransition, useCallback } from 'react'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code: string }

export type ExchangeMode = 'exchange' | 'renew'

export function useExchange({
  mode,
  price,
  userCredits,
  onSuccess,
}: {
  mode: ExchangeMode
  price: number
  userCredits?: number
  onSuccess?: (data: { credits: number; expiresAt: string | null }) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const insufficient = (userCredits ?? Infinity) < price

  const execute = useCallback(
    async (payload: { macroSlug?: string; exchangeId?: number | string }) => {
      setError(null)
      if (insufficient) {
        setError(`积分不足，需要 ${price} 积分`)
        return
      }

      startTransition(async () => {
        try {
          const url = mode === 'renew' ? '/api/macro/renew' : '/api/macro/exchange'
          const body =
            mode === 'renew'
              ? JSON.stringify({ exchangeId: payload.exchangeId })
              : JSON.stringify({ macroSlug: payload.macroSlug })

          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body,
          })

          const data = (await resp.json()) as ApiResponse<{ credits?: number; expiresAt?: string | null }>
          if (!resp.ok || !data.success) {
            setError(data.success === false ? data.error : '操作失败')
            return
          }

          onSuccess?.({ credits: data.data.credits ?? 0, expiresAt: data.data.expiresAt ?? null })
          window.location.reload()
        } catch (e) {
          setError(e instanceof Error ? e.message : '请求失败')
        }
      })
    },
    [mode, price, insufficient, onSuccess],
  )

  return { execute, error, isPending, insufficient }
}
