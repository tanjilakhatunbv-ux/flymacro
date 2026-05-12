import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP } from '../../../../lib/rate-limit'
import { success, badRequest, conflict, internalError } from '../../../../lib/api-response'
import { validatePasswordStrength } from '../../../../lib/validation'
import { verifyTurnstile } from '../../../../lib/turnstile'

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

  const payload = await getPayload()

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) {
    return conflict('该邮箱已注册，请直接登录或使用「忘记密码」', 'email_exists')
  }

  let user: { id: number }
  try {
    user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name: name || undefined,
        role: 'user',
        credits: 0,
        _verified: false,
      } as never,
      overrideAccess: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '注册失败'
    return internalError(msg)
  }

  // Audit log for registration
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'register',
        collection: 'users',
        docId: String(user.id),
        operator: user.id,
        ip,
        reason: '用户注册（待邮箱验证）',
        metadata: { email },
      },
      overrideAccess: true,
    })
  } catch {
    /* audit log failure must not block registration */
  }

  return NextResponse.json(success({ ok: true }))
}
