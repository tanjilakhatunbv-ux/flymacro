import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getCachedUnreadCount } from '../../../../lib/notification-cache'
import { success, internalError } from '../../../../lib/api-response'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(success({ count: 0 }))
  }

  try {
    const count = await getCachedUnreadCount(user.id)
    return NextResponse.json(success({ count }))
  } catch {
    return internalError('查询未读通知失败')
  }
}
