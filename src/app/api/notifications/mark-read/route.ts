import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
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

  const payload = await getPayload()

  try {
    const result = await payload.update({
      collection: 'notifications',
      where: {
        and: [
          { id: { equals: Number(id) } },
          { recipient: { equals: user.id } },
        ],
      },
      data: { read: true, readAt: new Date().toISOString() },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (!result.docs.length) {
      return notFound('notification-not-found')
    }

    return NextResponse.json(success({ ok: true }))
  } catch {
    return internalError('操作失败')
  }
}
