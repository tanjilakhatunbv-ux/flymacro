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
    await payload.update({
      collection: 'notifications',
      where: {
        recipient: { equals: user.id },
        read: { equals: false },
      },
      data: { read: true, readAt: new Date().toISOString() },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

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
    const result = await payload.update({
      collection: 'notifications',
      where: {
        and: [
          { id: { equals: id } },
          { recipient: { equals: user.id } },
        ],
      },
      data: { read: true, readAt: new Date().toISOString() },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!result.docs.length) return { error: '通知不存在或无权操作' }

    revalidatePath('/account/notifications')
    revalidatePath('/account')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '操作失败' }
  }
}
