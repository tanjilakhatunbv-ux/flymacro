import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { markNotificationReadForUser } from '../../../../lib/notification-actions'
import { success, unauthorized, badRequest, notFound, internalError } from '../../../../lib/api-response'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  let body: { id?: number | string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid-body')
  }

  const { id } = body
  if (!id) {
    return badRequest('缺少通知标识', 'missing-id')
  }

  try {
    const updated = await markNotificationReadForUser(user.id, Number(id))
    if (!updated) {
      return notFound('notification-not-found')
    }

    return NextResponse.json(success({ ok: true }))
  } catch {
    return internalError('操作失败')
  }
}
