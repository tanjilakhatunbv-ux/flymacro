import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const payload = await getPayload()

  try {
    const { id } = user
    // not_equals catches both false and null
    await payload.update({
      collection: 'notifications',
      where: {
        recipient: { equals: id },
        read: { not_equals: true },
      },
      data: { read: true, readAt: new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
