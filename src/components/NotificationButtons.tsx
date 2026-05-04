'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { markAllNotificationsReadAction } from '../lib/notification-actions'

export function MarkAllReadButton() {
  const [state, action] = useActionState(markAllNotificationsReadAction, {})

  return (
    <form action={action} style={{ display: 'inline' }}>
      <SubmitButton />
      {state.error && <span className="auth-field-err" style={{ marginLeft: 8 }}>{state.error}</span>}
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn" disabled={pending} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
      {pending ? '处理中…' : '全部已读'}
    </button>
  )
}
