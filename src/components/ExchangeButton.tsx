'use client'

import { useExchange } from '../hooks/useExchange'

export function ExchangeButton({
  macroSlug,
  price,
  userCredits = 0,
  mode = 'exchange',
  exchangeId,
}: {
  macroSlug: string
  price: number
  userCredits?: number
  mode?: 'exchange' | 'renew'
  exchangeId?: number | string
}) {
  const { execute, error, isPending, insufficient } = useExchange({
    mode,
    price,
    userCredits,
  })

  const handleClick = () => {
    if (mode === 'renew') {
      execute({ exchangeId })
    } else {
      execute({ macroSlug })
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleClick}
        disabled={isPending || insufficient}
      >
        {isPending
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
