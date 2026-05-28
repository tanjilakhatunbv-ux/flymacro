import { NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '../../../../lib/auth-service'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { badRequest } from '../../../../lib/api-response'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`forgot:${ip}`, [
    { max: 3, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('\u8bf7\u6c42\u4f53\u683c\u5f0f\u9519\u8bef', 'invalid_json')
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email) {
    return badRequest('\u8bf7\u8f93\u5165\u90ae\u7bb1', 'missing_email')
  }

  try {
    await sendPasswordResetEmail(email)
  } catch {
    // Do not reveal whether the email exists.
  }

  return NextResponse.json({ success: true, data: { ok: true } })
}
