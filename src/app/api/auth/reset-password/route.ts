import { NextResponse } from 'next/server'
import { resetPasswordWithReuseCheck } from '../../../../lib/auth-service'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { badRequest, internalError } from '../../../../lib/api-response'
import { validatePasswordStrength } from '../../../../lib/validation'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`reset:${ip}`, [
    { max: 5, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid_json')
  }

  const { token, password } = body
  if (!token || !password) {
    return badRequest('\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570', 'missing_params')
  }

  const strength = validatePasswordStrength(password)
  if (!strength.ok) {
    return badRequest(strength.error, 'password_weak')
  }

  try {
    const result = await resetPasswordWithReuseCheck({ token, password, ip })
    if (result === 'invalid_token') {
      return badRequest('Token \u65e0\u6548\u6216\u5df2\u8fc7\u671f', 'invalid_token')
    }
    if (result === 'password_reuse') {
      return badRequest('\u65b0\u5bc6\u7801\u4e0d\u80fd\u4e0e\u5f53\u524d\u5bc6\u7801\u76f8\u540c', 'password_reuse')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '\u5bc6\u7801\u91cd\u7f6e\u5931\u8d25'
    return internalError(message)
  }

  return NextResponse.json({ success: true, data: { ok: true } })
}
