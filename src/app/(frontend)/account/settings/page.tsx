'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfileAction, changePasswordAction, type ProfileActionState } from '../../../../lib/user-actions'

const profileInitial: ProfileActionState = {}
const passwordInitial: ProfileActionState = {}

export default function SettingsPage() {
  const [profileState, profileAction] = useActionState(updateProfileAction, profileInitial)
  const [passwordState, passwordAction] = useActionState(changePasswordAction, passwordInitial)

  return (
    <>
      <h1>账号设置</h1>
      <p className="lead">管理你的个人资料与账号安全。</p>

      <section className="ticket-form" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          修改昵称
        </h3>
        <form action={profileAction}>
          <label>
            <span>昵称</span>
            <input name="name" type="text" maxLength={50} placeholder="显示在页面上的名字" />
            {profileState.fieldErrors?.name && (
              <span className="auth-field-err">{profileState.fieldErrors.name}</span>
            )}
          </label>
          {profileState.error && (
            <div className="auth-error" role="alert">{profileState.error}</div>
          )}
          {profileState.ok && (
            <div className="auth-success" role="status">昵称已保存。</div>
          )}
          <SubmitBtn label="保存昵称" pendingLabel="保存中…" />
        </form>
      </section>

      <section className="ticket-form">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>
          修改密码
        </h3>
        <form action={passwordAction}>
          <label>
            <span>当前密码</span>
            <input name="oldPassword" type="password" required autoComplete="current-password" />
            {passwordState.fieldErrors?.oldPassword && (
              <span className="auth-field-err">{passwordState.fieldErrors.oldPassword}</span>
            )}
          </label>
          <label>
            <span>新密码</span>
            <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
            {passwordState.fieldErrors?.newPassword && (
              <span className="auth-field-err">{passwordState.fieldErrors.newPassword}</span>
            )}
          </label>
          <label>
            <span>确认新密码</span>
            <input name="confirmPassword" type="password" required autoComplete="new-password" />
            {passwordState.fieldErrors?.confirmPassword && (
              <span className="auth-field-err">{passwordState.fieldErrors.confirmPassword}</span>
            )}
          </label>
          {passwordState.error && (
            <div className="auth-error" role="alert">{passwordState.error}</div>
          )}
          {passwordState.ok && (
            <div className="auth-success" role="status">密码已修改，下次登录请使用新密码。</div>
          )}
          <SubmitBtn label="修改密码" pendingLabel="修改中…" />
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
