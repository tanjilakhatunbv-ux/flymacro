import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { getAccessibleMacroCode } from '../../../../lib/macro-access'
import { unauthorized, badRequest, notFound, forbidden, success } from '../../../../lib/api-response'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'

export async function GET(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`code:${ip}`, [
    { max: 30, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41', code: 'rate_limited' },
      { status: 429 },
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('unauthenticated')
  }

  const { searchParams } = new URL(req.url)
  const macroId = searchParams.get('macroId')

  if (!macroId) {
    return badRequest('\u7f3a\u5c11\u5b8f ID', 'missing-macro-id')
  }

  const id = Number(macroId)
  if (!id || id <= 0) {
    return badRequest('\u65e0\u6548\u7684\u5b8f ID', 'invalid-macro-id')
  }

  const result = await getAccessibleMacroCode(user, id)
  if (result.forbidden) {
    return forbidden('\u672a\u5151\u6362\u6b64\u5b8f', 'no-exchange')
  }
  if (result.missing) {
    return notFound('macro-not-found')
  }

  return NextResponse.json(success({ code: result.code }))
}
