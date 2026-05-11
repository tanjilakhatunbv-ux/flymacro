'use client'

import { useTranslations } from 'next-intl'
import { useExchange } from '../hooks/useExchange'

export function ExchangeRenewButton({
  exchangeId,
  price,
  onSuccess,
}: {
  exchangeId: number | string
  price: number
  onSuccess?: (data: { credits: number; expiresAt: string | null }) => void
}) {
  const t = useTranslations('exchange')
  const { execute, error, isPending } = useExchange({
    mode: 'renew',
    price,
    onSuccess,
  })

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        onClick={() => execute({ exchangeId })}
        disabled={isPending}
      >
        {isPending ? t('renewing') : t('renewButton', { price })}
      </button>
      {error && <span className="auth-field-err" style={{ fontSize: '0.78rem' }}>{error}</span>}
    </div>
  )
}
