import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/admin-guard'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { user: operator, payload } = auth
  let body: { userId?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '无效请求' }, { status: 400 })
  }

  const { userId } = body
  if (!userId || typeof userId !== 'number') {
    return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
  }

  try {
    const target = await payload.findByID({ collection: 'users', id: userId, depth: 0 }) as unknown as User
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // Operator can only reset regular users' passwords
    if (operator.role === 'operator' && target.role !== 'user') {
      return NextResponse.json({ error: '运营仅能为普通用户重置密码' }, { status: 403 })
    }

    // Trigger Payload's forgotPassword flow
    await payload.forgotPassword({
      collection: 'users',
      data: { email: target.email },
      req: { payload } as never,
    })

    // Audit log
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'reset_password',
          collection: 'users',
          docId: String(userId),
          before: null,
          after: { email: target.email },
          operator: operator.id,
          reason: `管理员 ${operator.email} 触发密码重置邮件`,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        },
        overrideAccess: true,
      })
    } catch { /* non-blocking */ }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
