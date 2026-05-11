'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const t = useTranslations('notifications')

  async function handleClick() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }

      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        disabled={loading}
        onClick={handleClick}
        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
      >
        {loading ? t('processing') : t('markAllRead')}
      </button>
      {error && <span className="auth-field-err" style={{ marginLeft: 8 }}>{error}</span>}
    </>
  )
}
