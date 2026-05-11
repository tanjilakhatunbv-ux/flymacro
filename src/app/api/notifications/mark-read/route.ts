import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  let body: { id?: number | string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '无效请求' }, { status: 400 })
  }

  const { id } = body
  if (!id) {
    return NextResponse.json({ error: '缺少通知标识' }, { status: 400 })
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
      return NextResponse.json({ error: '通知不存在或无权操作' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
