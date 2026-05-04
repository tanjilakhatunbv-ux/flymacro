'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'

export async function markAllNotificationsReadAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const payload = await getPayload()

  try {
    await payload.update({
      collection: 'notifications',
      where: {
        and: [
          { recipient: { equals: user.id } },
          { read: { equals: false } },
        ],
      },
      data: { read: true },
      overrideAccess: true,
    })
    revalidatePath('/account/notifications')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '操作失败' }
  }
}

export async function markNotificationReadAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: '缺少通知标识' }

  const payload = await getPayload()

  try {
    const existing = await payload.findByID({
      collection: 'notifications',
      id,
      overrideAccess: true,
      depth: 0,
    })
    if (!existing) return { error: '通知不存在' }
    const ownerId = typeof existing.recipient === 'object' ? existing.recipient?.id : existing.recipient
    if (String(ownerId) !== String(user.id)) return { error: '无权操作' }

    await payload.update({
      collection: 'notifications',
      id,
      data: { read: true },
      overrideAccess: true,
    })
    revalidatePath('/account/notifications')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '操作失败' }
  }
}
