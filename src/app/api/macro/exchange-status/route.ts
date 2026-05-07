import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { badRequest, internalError, success } from '../../../../lib/api-response'
import type { MacroExchange } from '../../../../payload-types'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(success({
      loggedIn: false,
      isStaff: false,
      exchange: null,
      userCredits: 0,
    }))
  }

  const { searchParams } = new URL(req.url)
  const macroId = searchParams.get('macroId')

  if (!macroId) {
    return badRequest('缺少宏 ID', 'missing-macro-id')
  }

  const id = Number(macroId)
  if (!id || id <= 0) {
    return badRequest('无效的宏 ID', 'invalid-macro-id')
  }

  try {
    const payload = await getPayload()
    const staff = isStaffRole(user)

    const result = await payload.find({
      collection: 'macro-exchanges',
      where: {
        and: [
          { user: { equals: user.id } },
          { macro: { equals: id } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })

    const exchange = result.docs[0] as MacroExchange | undefined
    const now = new Date()
    const expired = exchange?.expiresAt ? new Date(exchange.expiresAt) <= now : false

    return NextResponse.json(success({
      loggedIn: true,
      isStaff: staff,
      exchange: exchange
        ? {
            id: exchange.id,
            expiresAt: exchange.expiresAt,
            autoRenew: exchange.autoRenew,
            expired,
          }
        : null,
      userCredits: user.credits ?? 0,
    }))
  } catch {
    return internalError('查询兑换状态失败')
  }
}
