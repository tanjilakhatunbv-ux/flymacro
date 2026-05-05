import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated', message: '请先登录。' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const macroId = searchParams.get('macroId')

  if (!macroId) {
    return NextResponse.json({ error: 'missing-macro-id', message: '缺少宏 ID' }, { status: 400 })
  }

  const payload = await getPayload()

  // Build a minimal req context so the afterRead hook sees the authenticated user
  const reqCtx = { user, payload } as any

  // Staff can always see code
  if (isStaffRole(user)) {
    const macro = await payload.findByID({
      collection: 'macros',
      id: Number(macroId),
      depth: 0,
      req: reqCtx,
    }).catch(() => null)
    if (!macro) {
      return NextResponse.json({ error: 'macro-not-found', message: '宏不存在。' }, { status: 404 })
    }
    return NextResponse.json({ code: (macro as any).codeContent ?? null })
  }

  // Check active exchange
  const now = new Date().toISOString()
  const exchange = await payload.find({
    collection: 'macro-exchanges',
    where: {
      and: [
        { user: { equals: user.id } },
        { macro: { equals: Number(macroId) } },
        {
          or: [
            { expiresAt: { exists: false } },
            { expiresAt: { greater_than_equal: now } },
          ],
        },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (exchange.docs.length === 0) {
    return NextResponse.json({ error: 'forbidden', message: '未兑换此宏。' }, { status: 403 })
  }

  const macro = await payload.findByID({
    collection: 'macros',
    id: Number(macroId),
    depth: 0,
    req: reqCtx,
  }).catch(() => null)

  if (!macro) {
    return NextResponse.json({ error: 'macro-not-found', message: '宏不存在。' }, { status: 404 })
  }

  return NextResponse.json({ code: (macro as any).codeContent ?? null })
}
