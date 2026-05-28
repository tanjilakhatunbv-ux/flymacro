import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { markAllNotificationsReadForUser } from '../../../../lib/notification-actions'
import { success, unauthorized, internalError } from '../../../../lib/api-response'

export async function POST(_req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  try {
    await markAllNotificationsReadForUser(user.id)

    return NextResponse.json(success({ ok: true }))
  } catch {
    return internalError('操作失败')
  }
}
