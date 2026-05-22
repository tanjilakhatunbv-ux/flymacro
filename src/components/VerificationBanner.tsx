'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { readSessionCache, isCacheValid } from '../lib/session-cache'
import { getApiErrorMessage } from '../lib/api-errors'

type User = {
  id: number
  email: string
  name?: string | null
  _verified?: boolean | null
}

const DISMISS_KEY = 'verification-banner-dismissed'

export function VerificationBanner() {
  const t = useTranslations('auth')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true)
      setLoading(false)
      return
    }

    function checkCache() {
      const cached = readSessionCache()
      if (cached && isCacheValid(cached.ts)) {
        setLoading(false)
        if (cached.user && cached.user._verified === false) {
          setUser({ id: Number(cached.user.id), email: '', _verified: false })
        }
        return true
      }
      return false
    }

    if (checkCache()) return

    // Cache miss: wait for HeaderAuth to populate session cache (up to 600ms)
    let attempts = 0
    const poll = setInterval(() => {
      attempts++
      if (checkCache() || attempts >= 3) {
        clearInterval(poll)
        setLoading(false)
      }
    }, 200)

    return () => clearInterval(poll)
  }, [])

  if (loading || !user || user._verified || dismissed) return null

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
        setMessage(data?.error ? getApiErrorMessage(data, t) : t('requestFailed'))
        setMessageType('error')
      }
    } catch {
      setMessage(t('requestFailed'))
      setMessageType('error')
    } finally {
      setSending(false)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <div className="verification-banner" role="alert">
      <div className="verification-banner-inner">
        <span className="verification-banner-text">
          {t('verificationBannerTitle')} <strong>{t('verificationBannerReward')}</strong>
        </span>
        <button
          type="button"
          className="verification-banner-btn"
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? t('processing') : t('verificationBannerCta')}
        </button>
        <button
          type="button"
          className="verification-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
          title={t('verificationDismissed')}
        >
          ×
        </button>
      </div>
      {message && (
        <p className={`verification-banner-msg ${messageType}`}>{message}</p>
      )}
    </div>
  )
}
