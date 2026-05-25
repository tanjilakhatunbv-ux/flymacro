import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/admin-guard'

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  let body: { id?: number | string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: '无效请求' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少兑换码 ID' }, { status: 400 })
  }

  const doc = await auth.payload.findByID({
    collection: 'redeem-codes',
    id: body.id,
    depth: 0,
    overrideAccess: true,
  }).catch(() => null)

  if (!doc) {
    return NextResponse.json({ success: false, error: '兑换码不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: { code: doc.code } })
}
