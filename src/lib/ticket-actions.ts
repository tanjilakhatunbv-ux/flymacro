'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'

export type TicketActionState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim() || undefined
  const priority = String(formData.get('priority') ?? 'normal').trim()

  const fieldErrors: Record<string, string> = {}
  if (!subject) fieldErrors.subject = '请填写主题'
  if (subject.length > 120) fieldErrors.subject = '主题最多 120 字'
  if (!body) fieldErrors.body = '请描述你的问题'
  if (body.length > 5000) fieldErrors.body = '内容最多 5000 字'
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const payload = await getPayload()

  let ticketId: string | number
  try {
    const ticket = await payload.create({
      collection: 'tickets',
      data: {
        subject,
        user: user.id,
        status: 'open',
        priority: priority as 'low' | 'normal' | 'high' | 'urgent',
        category: (category as 'refund' | 'usage' | 'account' | 'feedback' | 'other' | undefined) ?? undefined,
      },
      overrideAccess: true,
    })
    ticketId = ticket.id

    await payload.create({
      collection: 'ticket-messages',
      data: {
        ticket: ticket.id,
        sender: user.id,
        senderType: 'user',
        body: textToLexical(body),
      },
      overrideAccess: true,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '提交失败，请稍后再试' }
  }

  revalidatePath('/account/tickets')
  redirect(`/account/tickets/${ticketId}`)
}

export async function replyToTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const ticketId = String(formData.get('ticketId') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!ticketId) return { error: '工单标识无效' }
  if (!body) return { fieldErrors: { body: '请填写回复内容' } }

  const payload = await getPayload()

  const ticket = await payload.findByID({
    collection: 'tickets',
    id: ticketId,
    overrideAccess: true,
    depth: 0,
  })
  if (!ticket) return { error: '工单不存在' }
  const ownerId = typeof ticket.user === 'object' ? ticket.user?.id : ticket.user
  if (String(ownerId) !== String(user.id)) return { error: '无权回复此工单' }
  if (ticket.status === 'closed') return { error: '工单已关闭，无法回复' }

  try {
    await payload.create({
      collection: 'ticket-messages',
      data: {
        ticket: Number(ticketId),
        sender: user.id,
        senderType: 'user',
        body: textToLexical(body),
      },
      overrideAccess: true,
    })
    if (ticket.status === 'resolved') {
      await payload.update({
        collection: 'tickets',
        id: ticketId,
        data: { status: 'open' },
        overrideAccess: true,
      })
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '回复失败，请稍后再试' }
  }

  revalidatePath(`/account/tickets/${ticketId}`)
  return {}
}

function textToLexical(text: string): any {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((para) => para.replace(/\n/g, ' ').trim())
    .filter(Boolean)
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          {
            type: 'text',
            format: 0,
            mode: 'normal',
            text: p,
            detail: 0,
            style: '',
            version: 1,
          },
        ],
      })),
    },
  }
}
