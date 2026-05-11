'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { createTicketAction, replyToTicketAction, type TicketActionState } from '../lib/ticket-actions'

const initial: TicketActionState = {}

export function TicketCreateForm() {
  const [state, action] = useActionState(createTicketAction, initial)
  const t = useTranslations('ticket')

  return (
    <form action={action} className="ticket-form">
      <label>
        <span>{t('subjectField')}</span>
        <input
          name="subject"
          required
          maxLength={120}
          placeholder={t('subjectPlaceholder')}
          aria-invalid={!!state.fieldErrors?.subject}
        />
        {state.fieldErrors?.subject && <span className="auth-field-err">{state.fieldErrors.subject}</span>}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label>
          <span>{t('categoryField')}</span>
          <select name="category" defaultValue="">
            <option value="">{t('unspecified')}</option>
            <option value="refund">{t('categoryRefund')}</option>
            <option value="usage">{t('categoryMacro')}</option>
            <option value="account">{t('categoryAccount')}</option>
            <option value="feedback">{t('categoryFeedback')}</option>
            <option value="other">{t('categoryOther')}</option>
          </select>
        </label>
        <label>
          <span>{t('priorityField')}</span>
          <select name="priority" defaultValue="normal">
            <option value="low">{t('priorityLow')}</option>
            <option value="normal">{t('priorityNormal')}</option>
            <option value="high">{t('priorityHigh')}</option>
            <option value="urgent">{t('priorityUrgent')}</option>
          </select>
        </label>
      </div>

      <label>
        <span>{t('descriptionField')}</span>
        <textarea
          name="body"
          required
          maxLength={5000}
          placeholder={t('descriptionPlaceholder')}
          aria-invalid={!!state.fieldErrors?.body}
        />
        {state.fieldErrors?.body && <span className="auth-field-err">{state.fieldErrors.body}</span>}
      </label>

      {state.error && (
        <div className="auth-error" role="alert">
          {state.error}
        </div>
      )}

      <SubmitBtn label={t('submitTicket')} pendingLabel={t('submitting')} />
    </form>
  )
}

export function TicketReplyForm({ ticketId, disabled }: { ticketId: string | number; disabled?: boolean }) {
  const [state, action] = useActionState(replyToTicketAction, initial)
  const t = useTranslations('ticket')

  if (disabled) {
    return (
      <p className="auth-help" style={{ marginTop: '1.5rem' }}>
        {t('closedNotice')}
      </p>
    )
  }

  return (
    <form action={action} className="ticket-form" style={{ marginTop: '1.75rem' }}>
      <input type="hidden" name="ticketId" value={String(ticketId)} />
      <label>
        <span>{t('addReply')}</span>
        <textarea
          name="body"
          required
          maxLength={5000}
          placeholder={t('replyPlaceholder')}
          aria-invalid={!!state.fieldErrors?.body}
        />
        {state.fieldErrors?.body && <span className="auth-field-err">{state.fieldErrors.body}</span>}
      </label>
      {state.error && (
        <div className="auth-error" role="alert">
          {state.error}
        </div>
      )}
      <SubmitBtn label={t('sendReply')} pendingLabel={t('sending')} />
    </form>
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
