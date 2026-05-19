import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { badRequest } from '../../../../lib/api-response'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`forgot:${ip}`, [
    { max: 3, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email) {
    return badRequest('请输入邮箱', 'missing_email')
  }

  try {
    const payload = await getPayload()
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
    })
  } catch (_err) {
    // Silently ignore — do not reveal whether email exists
  }

  // Always return success to prevent email enumeration
  return NextResponse.json({ success: true, data: { ok: true } })
}
