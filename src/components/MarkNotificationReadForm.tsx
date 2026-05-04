'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { markNotificationReadAction } from '../lib/notification-actions'

export function MarkNotificationReadForm({ id }: { id: string }) {
  const [state, action] = useActionState(markNotificationReadAction, {})

  return (
    <form action={action} style={{ display: 'inline' }} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton />
      {state.error && <span className="auth-field-err" style={{ fontSize: '0.7rem', marginLeft: 4 }}>{state.error}</span>}
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '0.15rem 0.5rem',
        fontSize: '0.72rem',
        color: 'var(--gold)',
        background: 'transparent',
        border: '1px solid var(--border-soft)',
        borderRadius: 3,
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(212,175,55,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {pending ? '…' : '标记已读'}
    </button>
  )
}
