'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'

export async function markAllNotificationsReadAction(
  _prev: { error?: string },
  _formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const payload = await getPayload()

  try {
    const r = await payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: user.id },
        read: { equals: false },
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const now = new Date().toISOString()
    for (const doc of r.docs) {
      await payload.update({
        collection: 'notifications',
        id: doc.id,
        data: { read: true, readAt: now },
        overrideAccess: true,
      })
    }

    revalidatePath('/account/notifications')
    revalidatePath('/account')
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
      data: { read: true, readAt: new Date().toISOString() },
      overrideAccess: true,
    })
    revalidatePath('/account/notifications')
    revalidatePath('/account')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '操作失败' }
  }
}
