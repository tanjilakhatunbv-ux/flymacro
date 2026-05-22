import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getCachedUnreadCount } from '../../../../lib/notification-cache'
import { success } from '../../../../lib/api-response'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(success({ user: null, unread: 0 }))
  }

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    credits: user.credits,
    status: user.status,
    _verified: user._verified,
  }

  try {
    const unread = await getCachedUnreadCount(Number(user.id))
    return NextResponse.json(success({ user: userData, unread }))
  } catch {
    return NextResponse.json(success({ user: userData, unread: 0 }))
  }
}
