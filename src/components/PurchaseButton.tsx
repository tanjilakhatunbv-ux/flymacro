'use client'

import { useState, useTransition } from 'react'

export function PurchaseButton({
  macroSlug,
  modelIndex,
  modelName,
}: {
  macroSlug: string
  modelIndex: number
  modelName: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        const resp = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ macroSlug, modelIndex }),
        })
        const data = (await resp.json()) as { success?: boolean; data?: { checkoutUrl?: string }; error?: string; message?: string }
        if (!resp.ok || !data.success) {
          setError(data.error || data.message || '支付请求失败')
          return
        }
        if (data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl
        } else {
          setError('未获得支付链接')
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
        disabled={pending}
      >
        {pending ? '准备支付…' : `购买 ${modelName}`}
      </button>
      {error && (
        <p className="auth-field-err" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  )
}
