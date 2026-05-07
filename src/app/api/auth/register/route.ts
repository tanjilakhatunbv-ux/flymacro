import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
import { success, badRequest, conflict, internalError } from '../../../../lib/api-response'

type RegisterBody = {
  email?: string
  password?: string
  name?: string
  turnstileToken?: string
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = rateLimit(`register:${ip}`, { max: 3, windowMs: 60_000 })
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
        credits: 20,
      } as never,
      overrideAccess: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '注册失败'
    const errName = (err as { name?: string })?.name || ''
    const isResendDomainError =
      msg.includes('domain is not verified') ||
      msg.includes('validation_error') ||
      errName === 'validation_error'

    if (isResendDomainError) {
      try {
        user = await payload.create({
          collection: 'users',
          data: {
            email,
            password,
            name: name || undefined,
            role: 'user',
            credits: 20,
            _verified: true,
          } as never,
          overrideAccess: true,
        })
      } catch (innerErr) {
        const innerMsg = innerErr instanceof Error ? innerErr.message : '注册失败'
        return internalError(innerMsg)
      }

      await payload.create({
        collection: 'credit-transactions',
        data: {
          user: user.id,
          amount: 20,
          balanceAfter: 20,
          type: 'register_bonus',
          reason: '新用户注册奖励',
        },
        overrideAccess: true,
      })

      return NextResponse.json(success({
        warning: '账号已创建（邮箱验证暂时跳过，发件域名配置中）。请直接登录。',
      }))
    }

    return internalError(msg)
  }

  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: user.id,
      amount: 20,
      balanceAfter: 20,
      type: 'register_bonus',
      reason: '新用户注册奖励',
    },
    overrideAccess: true,
  })

  return NextResponse.json(success({ ok: true }))
}

async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    if (!resp.ok) return false
    const data = (await resp.json()) as { success?: boolean }
    return !!data?.success
  } catch {
    return false
  }
}
