import { NextResponse } from 'next/server'
import { claimVerificationBonus } from '../../../../lib/auth-service'
import { success, badRequest } from '../../../../lib/api-response'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'

/**
 * Called after email verification to award registration bonus.
 * Requires a valid verification token to prevent unauthorized claims.
 */
export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`claim:${ip}`, [
    { max: 3, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41', code: 'rate_limited' },
      { status: 429 },
    )
  }

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid_json')
  }

  const token = body.token
  if (!token) {
    return badRequest('\u7f3a\u5c11 token', 'missing_token')
  }

  const result = await claimVerificationBonus({ token, ip })
  if (result.status === 'invalid_token') {
    return badRequest('\u65e0\u6548\u7684\u9a8c\u8bc1\u4fe1\u606f', 'invalid_token')
  }
  if (result.status === 'already_claimed') {
    return NextResponse.json(success({ ok: true, message: 'already_claimed' }))
  }

  return NextResponse.json(success({ ok: true, credits: result.credits }))
}
