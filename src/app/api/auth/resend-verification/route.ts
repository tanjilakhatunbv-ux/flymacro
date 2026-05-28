import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/auth'
import { sendVerificationEmail } from '../../../../lib/auth-service'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { success, unauthorized, internalError } from '../../../../lib/api-response'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return unauthorized('\u8bf7\u5148\u767b\u5f55', 'not_authenticated')
  }

  if (user._verified) {
    return NextResponse.json(success({ alreadyVerified: true }))
  }

  const limit = await rateLimitWithFallback(`resend_verify:${user.id}`, [
    { max: 1, windowMs: 60_000 },
    { max: 5, windowMs: 3_600_000 },
    { max: 10, windowMs: 86_400_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  const ip = getClientIP(req)
  try {
    await sendVerificationEmail(user, ip)
    return NextResponse.json(success({ sent: true }))
  } catch (err) {
    const message = err instanceof Error ? err.message : '\u53d1\u9001\u5931\u8d25'
    return internalError(message, 'send_email_failed')
  }
}
