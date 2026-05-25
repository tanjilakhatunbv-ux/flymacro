'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { getApiErrorMessage } from '../lib/api-errors'

type RedeemCodeFormProps = {
  loggedIn: boolean
  returnPath?: string
}

export function RedeemCodeForm({ loggedIn, returnPath = '/account/redeem' }: RedeemCodeFormProps) {
  const t = useTranslations('redeemCode')
  const apiT = useTranslations()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loggedIn) return

    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const response = await fetch('/api/redeem-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ code }),
        })
        const data = (await response.json()) as {
          success?: boolean
          data?: { creditsGranted?: number; balanceAfter?: number }
          error?: string
          code?: string
        }

        if (!response.ok || !data.success) {
          setError(getApiErrorMessage({ success: false, error: data.error || '', code: data.code || '' }, apiT))
          return
        }

        setCode('')
        setSuccess(t('successMessage', {
          credits: data.data?.creditsGranted ?? 0,
          balance: data.data?.balanceAfter ?? 0,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : t('requestFailed'))
      }
    })
  }

  return (
    <section className="redeem-code-panel">
      <div>
        <h2>{t('formTitle')}</h2>
        <p>{t('formSubtitle')}</p>
      </div>
      {loggedIn ? (
        <form onSubmit={handleSubmit} className="redeem-code-form">
          <label>
            <span>{t('codeField')}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('placeholder')}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? t('submitting') : t('submit')}
          </button>
        </form>
      ) : (
        <Link href={`/auth?mode=login&return=${encodeURIComponent(returnPath)}`} className="btn btn-primary">
          {t('loginRequired')}
        </Link>
      )}
      {success && <p className="auth-success" role="status">{success}</p>}
      {error && <p className="auth-field-err" role="alert">{error}</p>}
    </section>
  )
}
