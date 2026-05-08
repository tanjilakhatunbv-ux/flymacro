import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimit, getClientIP } from '../../../../lib/rate-limit'
import { success, badRequest, unauthorized, forbidden, internalError } from '../../../../lib/api-response'
import type { User } from '../../../../payload-types'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = rateLimit(`login:${ip}`, { max: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const { email, password } = body

  if (!email || !password) {
    return badRequest('请填写邮箱和密码', 'missing_credentials')
  }

  try {
    const payload = await getPayload()

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
      depth: 0,
    })

    if (!result || !result.token) {
      return unauthorized('invalid_credentials')
    }

    const user = result.user as User

    // Check account status
    if (user.status === 'suspended') {
      return forbidden('账号已被停用，请联系客服', 'account_suspended')
    }
    if (user.status === 'banned') {
      return forbidden('账号已被封禁，请联系客服', 'account_banned')
    }

    // Update login metadata
    try {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          lastLoginAt: new Date().toISOString(),
          loginCount: ((user.loginCount ?? 0) as number) + 1,
        } as never,
        overrideAccess: true,
      })
    } catch {
      /* ignore metadata update failures */
    }

    const response = NextResponse.json(success({
      user,
      token: result.token,
      message: '登录成功',
    }))

    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : ''
    if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('密码') || msg.includes('incorrect')) {
      return unauthorized('invalid_credentials')
    }
    if (msg.includes('not verified') || msg.includes('verify') || msg.includes('验证')) {
      return forbidden('邮箱未验证，请先完成邮箱验证', 'email_not_verified')
    }
    return internalError('登录失败，请稍后重试')
  }
}
