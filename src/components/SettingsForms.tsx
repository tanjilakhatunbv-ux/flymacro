'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateProfileAction, changePasswordAction, type ProfileActionState } from '../lib/user-actions'
import { readSessionCache, isCacheValid } from '../lib/session-cache'

const profileInitial: ProfileActionState = {}
const passwordInitial: ProfileActionState = {}

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
      {pending ? pendingLabel : label}
    </button>
  )
}

export function SettingsForms() {
  const t = useTranslations('settings')
  const ta = useTranslations('auth')
  const [profileState, profileAction] = useActionState(updateProfileAction, profileInitial)
  const [passwordState, passwordAction] = useActionState(changePasswordAction, passwordInitial)
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const cached = readSessionCache()
    if (cached?.user && isCacheValid(cached.ts)) {
      setVerified(cached.user._verified !== false)
      return
    }
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setVerified(data.data._verified !== false)
        }
      })
      .catch(() => setVerified(true))
  }, [])

  return (
    <>
      <section className="ticket-form" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          {t('changeNickname')}
        </h3>
        <form action={profileAction}>
          <label>
            <span>{t('nicknameField')}</span>
            <input name="name" type="text" maxLength={50} placeholder={t('nicknamePlaceholder')} />
            {profileState.fieldErrors?.name && (
              <span className="auth-field-err">{profileState.fieldErrors.name}</span>
            )}
          </label>
          {profileState.error && <div className="auth-error" role="alert">{profileState.error}</div>}
          {profileState.ok && <div className="auth-success" role="status">{t('nicknameSaved')}</div>}
          <SubmitBtn label={t('saveNickname')} pendingLabel={t('saving')} />
        </form>
      </section>

      <section className="ticket-form">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          {t('changePassword')}
        </h3>
        {verified === false ? (
          <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
            {ta('passwordChangeLocked')}
          </div>
        ) : (
          <form action={passwordAction}>
            <label>
              <span>{t('currentPassword')}</span>
              <input name="oldPassword" type="password" required autoComplete="current-password" />
              {passwordState.fieldErrors?.oldPassword && (
                <span className="auth-field-err">{passwordState.fieldErrors.oldPassword}</span>
              )}
            </label>
            <label>
              <span>{t('newPassword')}</span>
              <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
              {passwordState.fieldErrors?.newPassword && (
                <span className="auth-field-err">{passwordState.fieldErrors.newPassword}</span>
              )}
            </label>
            <label>
              <span>{t('confirmNewPassword')}</span>
              <input name="confirmPassword" type="password" required autoComplete="new-password" />
              {passwordState.fieldErrors?.confirmPassword && (
                <span className="auth-field-err">{passwordState.fieldErrors.confirmPassword}</span>
              )}
            </label>
            {passwordState.error && <div className="auth-error" role="alert">{passwordState.error}</div>}
            {passwordState.ok && <div className="auth-success" role="status">{t('passwordChanged')}</div>}
            <SubmitBtn label={t('changePasswordButton')} pendingLabel={t('changing')} />
          </form>
        )}
      </section>
    </>
  )
}
