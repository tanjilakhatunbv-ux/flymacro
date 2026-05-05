'use client'

import { useState, useTransition } from 'react'

export function ExchangeButton({
  macroSlug,
  price,
  userCredits,
  mode = 'exchange',
  exchangeId,
}: {
  macroSlug: string
  price: number
  userCredits: number
  mode?: 'exchange' | 'renew'
  exchangeId?: number | string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const insufficient = userCredits < price

  async function handleClick() {
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
            ? JSON.stringify({ exchangeId })
            : JSON.stringify({ macroSlug })

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body,
        })
        const data = (await resp.json()) as { success?: boolean; error?: string; message?: string }
        if (!resp.ok) {
          setError(data.message || '兑换失败')
          return
        }
        if (data.success) {
          window.location.reload()
        } else {
          setError(data.message || '操作失败')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '请求失败')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleClick}
        disabled={pending || insufficient}
      >
        {pending
          ? mode === 'renew'
            ? '续费中…'
            : '兑换中…'
          : insufficient
            ? `积分不足 (${userCredits}/${price})`
            : mode === 'renew'
              ? `续费 ${price} 积分`
              : `兑换 ${price} 积分`}
      </button>
      {error && (
        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(220, 50, 50, 0.12)', border: '1px solid rgba(220, 50, 50, 0.35)', borderRadius: '4px', color: '#ff6b6b', fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  )
}
