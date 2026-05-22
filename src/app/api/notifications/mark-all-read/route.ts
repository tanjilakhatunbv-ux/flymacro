import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, unauthorized, internalError } from '../../../../lib/api-response'

export async function POST(_req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  const payload = await getPayload()

  try {
    await payload.update({
      collection: 'notifications',
      where: {
        recipient: { equals: user.id },
        read: { not_equals: true },
      },
      data: { read: true, readAt: new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(success({ ok: true }))
  } catch {
    return internalError('操作失败')
  }
}
