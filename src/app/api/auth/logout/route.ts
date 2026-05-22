import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getClientIP } from '../../../../lib/rate-limit'
import { success } from '../../../../lib/api-response'
import { writeAuditLog } from '../../../../lib/audit'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (user) {
    writeAuditLog({
      action: 'logout',
      collection: 'users',
      docId: String(user.id),
      operator: user.id,
      ip: getClientIP(req),
      reason: '用户主动退出登录',
    })
  }

  const response = NextResponse.json(success({ message: '已退出登录' }))

  response.cookies.set('payload-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })

  return response
}
