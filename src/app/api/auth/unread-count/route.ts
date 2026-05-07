import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { success, internalError } from '../../../../lib/api-response'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(success({ count: 0 }))
  }

  try {
    const payload = await getPayload()
    const r = await payload.count({
      collection: 'notifications',
      where: {
        and: [{ recipient: { equals: user.id } }, { read: { equals: false } }],
      },
      overrideAccess: true,
    })
    return NextResponse.json(success({ count: r.totalDocs ?? 0 }))
  } catch {
    return internalError('查询未读通知失败')
  }
}
