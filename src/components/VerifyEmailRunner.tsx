'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

type State = 'pending' | 'ok' | 'fail'

export function VerifyEmailRunner({ token }: { token: string }) {
  const t = useTranslations('verify')
  const [state, setState] = useState<State>('pending')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const resp = await fetch(`/api/users/verify/${encodeURIComponent(token)}`, {
          method: 'POST',
          credentials: 'same-origin',
        })
        if (cancelled) return
        if (resp.ok) {
          setState('ok')
          // Claim registration bonus after successful verification
          try {
            const email = sessionStorage.getItem('register-email') || undefined
            await fetch('/api/auth/claim-bonus', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, email }),
            })
            sessionStorage.removeItem('register-email')
          } catch {
            /* bonus claim failure should not affect UX */
          }
        } else {
          let msg = t('failedMessage')
          try {
            const data = (await resp.json()) as { message?: string }
            if (data?.message) msg = data.message
          } catch {
            /* ignore */
          }
          setErrorMsg(msg)
          setState('fail')
        }
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e instanceof Error ? e.message : t('failed'))
        setState('fail')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token, t])

  if (state === 'pending') {
    return (
      <p className="auth-help" role="status">
        {t('verifying')}
      </p>
    )
  }
  if (state === 'ok') {
    return (
      <div className="auth-success" role="status" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p>{t('success')}</p>
        <Link href="/login" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {t('goLogin')}
        </Link>
      </div>
    )
  }
  return (
    <div className="auth-error" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p>{errorMsg}</p>
      <p className="auth-help">
        {t('expiredHelp')}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link href="/register" className="btn">
          {t('reRegister')}
        </Link>
        <Link href="/login" className="btn">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}
