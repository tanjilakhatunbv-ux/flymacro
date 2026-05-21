'use client'

import { useState, useTransition, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getApiErrorMessage } from '../lib/api-errors'

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
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const insufficient = (userCredits ?? Infinity) < price

  const execute = useCallback(
    async (payload: { macroSlug?: string; exchangeId?: number | string }) => {
      setError(null)
      if (insufficient) {
        setError(t('apiErrors.insufficient_credits'))
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
            setError(getApiErrorMessage(data as { success: false; error: string; code: string }, t))
            return
          }

          onSuccess?.({ credits: data.data.credits ?? 0, expiresAt: data.data.expiresAt ?? null })
          window.location.reload()
        } catch {
          setError(t('apiErrors.unknown'))
        }
      })
    },
    [mode, price, insufficient, onSuccess, t],
  )

  return { execute, error, isPending, insufficient }
}
