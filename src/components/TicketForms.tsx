'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createTicketAction, replyToTicketAction, type TicketActionState } from '../lib/ticket-actions'

const initial: TicketActionState = {}

export function TicketCreateForm() {
  const [state, action] = useActionState(createTicketAction, initial)

  return (
    <form action={action} className="ticket-form">
      <label>
        <span>主题</span>
        <input
          name="subject"
          required
          maxLength={120}
          placeholder="简要描述你的问题"
          aria-invalid={!!state.fieldErrors?.subject}
        />
        {state.fieldErrors?.subject && <span className="auth-field-err">{state.fieldErrors.subject}</span>}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label>
          <span>分类</span>
          <select name="category" defaultValue="">
            <option value="">未指定</option>
            <option value="refund">退款申请</option>
            <option value="usage">宏使用问题</option>
            <option value="account">账号问题</option>
            <option value="feedback">建议反馈</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label>
          <span>优先级</span>
          <select name="priority" defaultValue="normal">
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </label>
      </div>

      <label>
        <span>详细描述</span>
        <textarea
          name="body"
          required
          maxLength={5000}
          placeholder="详细描述问题、复现步骤、出现时间等。如涉及订单或宏，可在主题中注明编号。"
          aria-invalid={!!state.fieldErrors?.body}
        />
        {state.fieldErrors?.body && <span className="auth-field-err">{state.fieldErrors.body}</span>}
      </label>

      {state.error && (
        <div className="auth-error" role="alert">
          {state.error}
        </div>
      )}

      <SubmitBtn label="提交工单" pendingLabel="提交中…" />
    </form>
  )
}

export function TicketReplyForm({ ticketId, disabled }: { ticketId: string | number; disabled?: boolean }) {
  const [state, action] = useActionState(replyToTicketAction, initial)

  if (disabled) {
    return (
      <p className="auth-help" style={{ marginTop: '1.5rem' }}>
        工单已关闭，如需继续沟通请提交新工单。
      </p>
    )
  }

  return (
    <form action={action} className="ticket-form" style={{ marginTop: '1.75rem' }}>
      <input type="hidden" name="ticketId" value={String(ticketId)} />
      <label>
        <span>追加回复</span>
        <textarea
          name="body"
          required
          maxLength={5000}
          placeholder="补充信息或回应客服…"
          aria-invalid={!!state.fieldErrors?.body}
        />
        {state.fieldErrors?.body && <span className="auth-field-err">{state.fieldErrors.body}</span>}
      </label>
      {state.error && (
        <div className="auth-error" role="alert">
          {state.error}
        </div>
      )}
      <SubmitBtn label="发送回复" pendingLabel="发送中…" />
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
