'use client'

import { useState, useTransition } from 'react'

export function ExchangeRenewButton({
  exchangeId,
  price,
  onSuccess,
}: {
  exchangeId: number | string
  price: number
  onSuccess?: (data: { credits: number; expiresAt: string | null }) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleRenew() {
    setError(null)
    startTransition(async () => {
      try {
        const resp = await fetch('/api/macro/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ exchangeId }),
        })
        const data = (await resp.json()) as {
          success?: boolean
          error?: string
          message?: string
          credits?: number
          expiresAt?: string | null
        }
        if (!resp.ok || !data.success) {
          setError(data.message || '续费失败')
          return
        }
        onSuccess?.({ credits: data.credits ?? 0, expiresAt: data.expiresAt ?? null })
        window.location.reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : '请求失败')
      }
    })
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        onClick={handleRenew}
        disabled={isPending}
      >
        {isPending ? '续费中…' : `续费 (${price} 积分)`}
      </button>
      {error && <span className="auth-field-err" style={{ fontSize: '0.78rem' }}>{error}</span>}
    </div>
  )
}
