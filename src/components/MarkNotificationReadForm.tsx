'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function MarkNotificationReadForm({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const t = useTranslations('notifications')

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }

      router.refresh()
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        style={{
          padding: '0.15rem 0.5rem',
          fontSize: '0.72rem',
          color: 'var(--gold)',
          background: 'transparent',
          border: '1px solid var(--border-soft)',
          borderRadius: 3,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212,175,55,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {loading ? '…' : t('markRead')}
      </button>
      {error && <span className="auth-field-err" style={{ fontSize: '0.7rem', marginLeft: 4 }}>{error}</span>}
    </>
  )
}
