import { NextResponse } from 'next/server'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { success, badRequest, conflict, internalError } from '../../../../lib/api-response'
import { validatePasswordStrength } from '../../../../lib/validation'
import { verifyTurnstile } from '../../../../lib/turnstile'
import { setAuthCookie } from '../../../../lib/session'
import {
  createPasswordUser,
  findUserByEmail,
  signAuthToken,
  writeUserAuditLog,
} from '../../../../lib/auth-service'
import type { User } from '../../../../payload-types'

type RegisterBody = {
  email?: string
  password?: string
  name?: string
  turnstileToken?: string
  website?: string
  _t?: number | string
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`register:${ip}`, [
    { max: 3, windowMs: 60_000 },
    { max: 10, windowMs: 3_600_000 },
    { max: 50, windowMs: 86_400_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: RegisterBody
  try {
    body = (await req.json()) as RegisterBody
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  // Honeypot check — bots fill hidden fields
  if (String(body.website ?? '').trim()) {
    return NextResponse.json(success({ ok: true }))
  }

  // Timing check — humans need > 3s to fill a form
  const formTime = Number(body._t) || 0
  if (formTime && Date.now() - formTime < 3000) {
    return NextResponse.json(success({ ok: true }))
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const name = (body.name ?? '').trim()

  if (!email || !password) {
    return badRequest('邮箱和密码必填', 'missing_credentials')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest('邮箱格式不正确', 'invalid_email')
  }
  if (password.length < 8) {
    return badRequest('密码至少 8 位', 'password_too_short')
  }
  const strength = validatePasswordStrength(password)
  if (!strength.ok) {
    return badRequest(strength.error, 'password_weak')
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    if (!body.turnstileToken) {
      return badRequest('请先完成人机验证', 'missing_turnstile')
    }
    const ok = await verifyTurnstile(body.turnstileToken, turnstileSecret, ip)
    if (!ok) {
      return badRequest('人机验证失败，请刷新页面重试', 'turnstile_failed')
    }
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return conflict('\u8be5\u90ae\u7bb1\u5df2\u6ce8\u518c\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55\u6216\u4f7f\u7528\u300c\u5fd8\u8bb0\u5bc6\u7801\u300d', 'email_exists')
  }

  let user: User
  try {
    user = await createPasswordUser({ email, password, name })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '\u6ce8\u518c\u5931\u8d25'
    return internalError(msg)
  }

  // Auto-login: sign JWT directly to bypass Payload's verify gate.
  // Users can use the full site without email verification.
  const token = await signAuthToken(user)

  // Audit log for registration
  await writeUserAuditLog(
    'register',
    user,
    ip,
    '\u6ce8\u518c\u5e76\u81ea\u52a8\u767b\u5f55\uff0c\u7b49\u5f85\u90ae\u7bb1\u9a8c\u8bc1',
    undefined,
    { email },
  )

  const response = NextResponse.json(success({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      _verified: false,
    },
    verificationPending: true,
    autoLoggedIn: true,
  }))

  setAuthCookie(response, token)

  return response
}
