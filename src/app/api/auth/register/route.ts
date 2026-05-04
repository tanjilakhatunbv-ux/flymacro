import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'

type RegisterBody = {
  email?: string
  password?: string
  name?: string
  turnstileToken?: string
}

export async function POST(req: Request) {
  let body: RegisterBody
  try {
    body = (await req.json()) as RegisterBody
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const name = (body.name ?? '').trim()

  if (!email || !password) {
    return NextResponse.json(
      { errors: [{ field: 'email', message: '邮箱和密码必填' }] },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { errors: [{ field: 'email', message: '邮箱格式不正确' }] },
      { status: 400 },
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { errors: [{ field: 'password', message: '密码至少 8 位' }] },
      { status: 400 },
    )
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    if (!body.turnstileToken) {
      return NextResponse.json(
        { errors: [{ message: '请先完成人机验证' }] },
        { status: 400 },
      )
    }
    const ok = await verifyTurnstile(body.turnstileToken, turnstileSecret, getClientIp(req))
    if (!ok) {
      return NextResponse.json(
        { errors: [{ message: '人机验证失败，请刷新页面重试' }] },
        { status: 400 },
      )
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
    return NextResponse.json(
      { errors: [{ field: 'email', message: '该邮箱已注册，请直接登录或使用「忘记密码」' }] },
      { status: 409 },
    )
  }

  let user: any
  try {
    user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name: name || undefined,
        role: 'user',
        credits: 20,
      },
      overrideAccess: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '注册失败'
    const errName = (err as any)?.name || ''
    const isResendDomainError =
      msg.includes('domain is not verified') ||
      msg.includes('validation_error') ||
      errName === 'validation_error'

    if (isResendDomainError) {
      // Email domain not verified: create user as pre-verified so they can log in immediately
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
          } as any,
          overrideAccess: true,
        })
      } catch (innerErr) {
        const innerMsg = innerErr instanceof Error ? innerErr.message : '注册失败'
        return NextResponse.json({ errors: [{ message: innerMsg }] }, { status: 500 })
      }

      // Create register bonus transaction
      await payload.create({
        collection: 'credit-transactions',
        data: {
          user: user.id,
          amount: 20,
          balanceAfter: 20,
          type: 'register_bonus',
          reason: '新用户注册奖励',
        } as any,
        overrideAccess: true,
      })

      return NextResponse.json({
        ok: true,
        warning: '账号已创建（邮箱验证暂时跳过，发件域名配置中）。请直接登录。',
      })
    }

    return NextResponse.json({ errors: [{ message: msg }] }, { status: 500 })
  }

  // Create register bonus transaction
  await payload.create({
    collection: 'credit-transactions',
    data: {
      user: user.id,
      amount: 20,
      balanceAfter: 20,
      type: 'register_bonus',
      reason: '新用户注册奖励',
    } as any,
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
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

function getClientIp(req: Request): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim()
  return req.headers.get('cf-connecting-ip') ?? undefined
}
