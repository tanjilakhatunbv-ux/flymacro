'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'

export async function markAllNotificationsReadForUser(userId: number): Promise<void> {
  const payload = await getPayload()

  await payload.update({
    collection: 'notifications',
    where: {
      recipient: { equals: userId },
      read: { not_equals: true },
    },
    data: { read: true, readAt: new Date().toISOString() },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
}

export async function markNotificationReadForUser(userId: number, notificationId: number | string): Promise<boolean> {
  const payload = await getPayload()

  const result = await payload.update({
    collection: 'notifications',
    where: {
      and: [
        { id: { equals: notificationId } },
        { recipient: { equals: userId } },
      ],
    },
    data: { read: true, readAt: new Date().toISOString() },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs.length > 0
}

export async function markAllNotificationsReadAction(
  _prev: { error?: string },
  _formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '\u8bf7\u5148\u767b\u5f55' }

  try {
    await markAllNotificationsReadForUser(user.id)

    revalidatePath('/account/notifications')
    revalidatePath('/account')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '\u64cd\u4f5c\u5931\u8d25' }
  }
}

export async function markNotificationReadAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '\u8bf7\u5148\u767b\u5f55' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: '\u7f3a\u5c11\u901a\u77e5\u6807\u8bc6' }

  try {
    const updated = await markNotificationReadForUser(user.id, id)
    if (!updated) return { error: '\u901a\u77e5\u4e0d\u5b58\u5728\u6216\u65e0\u6743\u64cd\u4f5c' }

    revalidatePath('/account/notifications')
    revalidatePath('/account')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : '\u64cd\u4f5c\u5931\u8d25' }
  }
}
