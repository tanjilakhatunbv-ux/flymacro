'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateProfileAction, changePasswordAction, type ProfileActionState } from '../../../../../lib/user-actions'

export const dynamic = 'force-dynamic'

const profileInitial: ProfileActionState = {}
const passwordInitial: ProfileActionState = {}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const [profileState, profileAction] = useActionState(updateProfileAction, profileInitial)
  const [passwordState, passwordAction] = useActionState(changePasswordAction, passwordInitial)

  return (
    <>
      <h1>{t('heading')}</h1>
      <p className="lead">{t('subtitle')}</p>

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
          {profileState.error && (
            <div className="auth-error" role="alert">{profileState.error}</div>
          )}
          {profileState.ok && (
            <div className="auth-success" role="status">{t('nicknameSaved')}</div>
          )}
          <SubmitBtn label={t('saveNickname')} pendingLabel={t('saving')} />
        </form>
      </section>

      <section className="ticket-form">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          {t('changePassword')}
        </h3>
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
          {passwordState.error && (
            <div className="auth-error" role="alert">{passwordState.error}</div>
          )}
          {passwordState.ok && (
            <div className="auth-success" role="status">{t('passwordChanged')}</div>
          )}
          <SubmitBtn label={t('changePasswordButton')} pendingLabel={t('changing')} />
        </form>
      </section>
    </>
  )
}

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
      {pending ? pendingLabel : label}
    </button>
  )
}
