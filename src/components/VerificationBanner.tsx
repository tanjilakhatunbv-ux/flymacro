'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type User = {
  id: number
  email: string
  name?: string | null
  _verified?: boolean | null
}

export function VerificationBanner() {
  const t = useTranslations('auth')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setUser(data.data as User)
        }
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !user || user._verified) return null

  async function handleResend() {
    if (sending) return
    setSending(true)
    setMessage(null)
    try {
      const resp = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await resp.json()
      if (resp.ok && data?.success) {
        setMessage(t('resendSuccess'))
        setMessageType('success')
      } else if (resp.status === 429) {
        setMessage(t('resendRateLimited'))
        setMessageType('error')
      } else {
        setMessage(data?.error || t('requestFailed'))
        setMessageType('error')
      }
    } catch {
      setMessage(t('requestFailed'))
      setMessageType('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="verification-banner" role="alert">
      <div className="verification-banner-inner">
        <span className="verification-banner-text">
          {t('verificationBannerTitle')}
        </span>
        <button
          type="button"
          className="verification-banner-btn"
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? t('processing') : t('verificationBannerCta')}
        </button>
      </div>
      {message && (
        <p className={`verification-banner-msg ${messageType}`}>{message}</p>
      )}
    </div>
  )
}
