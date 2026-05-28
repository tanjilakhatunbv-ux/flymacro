import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { success, unauthorized, badRequest, notFound, forbidden, conflict, internalError } from '../../../../lib/api-response'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { MacroExchangeError, exchangeMacroForUser } from '../../../../lib/macro-exchange-service'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`exchange:${ip}`, [
    { max: 10, windowMs: 60_000 },
    { max: 50, windowMs: 3_600_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41', code: 'rate_limited' },
      { status: 429 },
    )
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized('unauthenticated')
    }

    let body: { macroSlug?: string }
    try {
      body = (await req.json()) as typeof body
    } catch {
      return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid-body')
    }

    const { macroSlug } = body
    if (!macroSlug) {
      return badRequest('\u7f3a\u5c11\u5b8f\u6807\u8bc6', 'missing-macro')
    }

    const result = await exchangeMacroForUser({ user, macroSlug, ip })
    return NextResponse.json(success(result))
  } catch (err) {
    if (err instanceof MacroExchangeError) {
      if (err.code === 'macro-not-found') return notFound('macro-not-found')
      if (err.code === 'invalid-macro') return badRequest('\u8be5\u5b8f\u65e0\u6cd5\u5151\u6362', 'invalid-macro')
      if (err.code === 'already-exchanged') {
        return conflict('\u4f60\u5df2\u7ecf\u5151\u6362\u8fc7\u6b64\u5b8f\uff0c\u4e14\u4ecd\u5728\u6709\u6548\u671f\u5185', 'already-exchanged')
      }
      if (err.code === 'insufficient-credits') {
        const price = typeof err.metadata?.price === 'number' ? err.metadata.price : 0
        return forbidden(`\u70b9\u5238\u4e0d\u8db3\uff0c\u9700\u8981 ${price} \u70b9\u5238`, 'insufficient-credits')
      }
    }
    return internalError('\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef')
  }
}
