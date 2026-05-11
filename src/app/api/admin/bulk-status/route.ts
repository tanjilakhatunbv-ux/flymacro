import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/admin-guard'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { user: operator, payload } = auth
  let body: { userIds?: number[]; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '无效请求' }, { status: 400 })
  }

  const { userIds, status: rawStatus } = body
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds 不能为空' }, { status: 400 })
  }
  if (!['active', 'suspended', 'banned'].includes(rawStatus ?? '')) {
    return NextResponse.json({ error: '无效状态值' }, { status: 400 })
  }
  if (userIds.length > 100) {
    return NextResponse.json({ error: '单次最多操作 100 个用户' }, { status: 400 })
  }

  const status = rawStatus as 'active' | 'suspended' | 'banned'

  const results: { id: number; success: boolean; error?: string }[] = []

  for (const uid of userIds) {
    try {
      const target = await payload.findByID({ collection: 'users', id: uid, depth: 0 }) as unknown as User

      // Operator can only change regular users
      if (operator.role === 'operator' && target.role !== 'user') {
        results.push({ id: uid, success: false, error: '无权操作此用户' })
        continue
      }

      await payload.update({
        collection: 'users',
        id: uid,
        data: { status },
        overrideAccess: true,
      })

      // Audit log
      try {
        await payload.create({
          collection: 'audit-logs',
          data: {
            action: 'change_status',
            collection: 'users',
            docId: String(uid),
            before: { status: target.status },
            after: { status },
            operator: operator.id,
            reason: `批量状态变更为 ${status}`,
            ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          },
          overrideAccess: true,
        })
      } catch { /* non-blocking */ }

      results.push({ id: uid, success: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败'
      results.push({ id: uid, success: false, error: message })
    }
  }

  const successCount = results.filter((r) => r.success).length
  return NextResponse.json({ success: true, processed: results, total: successCount })
}
