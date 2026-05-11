import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/admin-guard'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { user: operator, payload } = auth
  let body: { userId?: number; amount?: number; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '无效请求' }, { status: 400 })
  }

  const { userId, amount, reason } = body
  if (!userId || typeof userId !== 'number') {
    return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
  }
  if (!amount || typeof amount !== 'number' || amount === 0) {
    return NextResponse.json({ error: 'amount 必须为非零整数' }, { status: 400 })
  }

  try {
    const target = await payload.findByID({ collection: 'users', id: userId, depth: 0 }) as unknown as User
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // Operator can only adjust regular users
    if (operator.role === 'operator' && target.role !== 'user') {
      return NextResponse.json({ error: '运营仅能调整普通用户积分' }, { status: 403 })
    }

    const currentCredits = (target.credits as number) ?? 0
    const newCredits = currentCredits + amount
    if (newCredits < 0) {
      return NextResponse.json({ error: '积分余额不足' }, { status: 400 })
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: { credits: newCredits },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'credit-transactions',
      data: {
        user: userId,
        amount,
        balanceAfter: newCredits,
        type: 'admin_adjust',
        reason: reason || `管理员 ${operator.email} 调整积分`,
      },
      overrideAccess: true,
    })

    // Audit log
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'adjust_credits',
          collection: 'users',
          docId: String(userId),
          before: { credits: currentCredits },
          after: { credits: newCredits },
          operator: operator.id,
          reason: reason || undefined,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        },
        overrideAccess: true,
      })
    } catch { /* audit failure non-blocking */ }

    return NextResponse.json({ success: true, credits: newCredits })
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
