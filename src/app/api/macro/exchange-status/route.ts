import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { getMacroExchangeStatus } from '../../../../lib/macro-access'
import { badRequest, internalError, success } from '../../../../lib/api-response'

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
    const staff = isStaffRole(user)
    const exchange = await getMacroExchangeStatus(user.id, id)

    return NextResponse.json(success({
      loggedIn: true,
      isStaff: staff,
      exchange,
      userCredits: user.credits ?? 0,
    }))
  } catch {
    return internalError('查询兑换状态失败')
  }
}
