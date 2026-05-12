import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { rateLimitWithFallback, getClientIP, getCount, incr, del } from '../../../../lib/rate-limit'
import { success, badRequest, unauthorized, forbidden, internalError } from '../../../../lib/api-response'
import { verifyTurnstile } from '../../../../lib/turnstile'
import type { User } from '../../../../payload-types'

const FAIL_THRESHOLD = 2
const FAIL_TTL = 600 // 10 minutes

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const limit = await rateLimitWithFallback(`login:${ip}`, [
    { max: 5, windowMs: 60_000 },
  ])
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { email?: string; password?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('请求体格式错误', 'invalid_json')
  }

  const { email, password } = body

  if (!email || !password) {
    return badRequest('请填写邮箱和密码', 'missing_credentials')
  }

  // Risk-triggered Turnstile: check failure counters
  const normalizedEmail = email.toLowerCase().trim()
  const ipFailKey = `login_fail_ip:${ip}`
  const emailFailKey = `login_fail_email:${normalizedEmail}`
  const ipFails = await getCount(ipFailKey)
  const emailFails = await getCount(emailFailKey)
  const needsCaptcha = ipFails >= FAIL_THRESHOLD || emailFails >= FAIL_THRESHOLD

  if (needsCaptcha) {
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret) {
      if (!body.turnstileToken) {
        return NextResponse.json(
          { success: false, error: '请完成人机验证后重试', code: 'captcha_required' },
          { status: 403 },
        )
      }
      const ok = await verifyTurnstile(body.turnstileToken, turnstileSecret, ip)
      if (!ok) {
        return badRequest('人机验证失败，请刷新页面重试', 'turnstile_failed')
      }
    }
  }

  const payload = await getPayload()

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
      depth: 0,
    })

    if (!result || !result.token) {
      // Increment failure counters
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)

      // Audit log for failed login
      try {
        const failUsers = await payload.find({
          collection: 'users',
          where: { email: { equals: normalizedEmail } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (failUsers.docs.length > 0) {
          await payload.create({
            collection: 'audit-logs',
            data: {
              action: 'login_failed',
              collection: 'users',
              docId: String(failUsers.docs[0].id),
              operator: failUsers.docs[0].id,
              ip,
              reason: '密码错误',
            },
            overrideAccess: true,
          })
        }
      } catch {
        /* ignore */
      }

      // If this failure just hit the threshold, tell frontend to show captcha next time
      const newIpFails = ipFails + 1
      const newEmailFails = emailFails + 1
      if (newIpFails >= FAIL_THRESHOLD || newEmailFails >= FAIL_THRESHOLD) {
        return NextResponse.json(
          { success: false, error: '邮箱或密码错误，请完成人机验证后重试', code: 'captcha_required' },
          { status: 401 },
        )
      }
      return unauthorized('invalid_credentials')
    }

    const user = result.user as User

    // Check email verification
    if (!user._verified) {
      return forbidden('邮箱尚未验证，请先查收验证邮件', 'email_not_verified')
    }

    // Check account status
    if (user.status === 'suspended') {
      return forbidden('账号已被停用，请联系客服', 'account_suspended')
    }
    if (user.status === 'banned') {
      return forbidden('账号已被封禁，请联系客服', 'account_banned')
    }

    // Clear failure counters on success
    await del(ipFailKey, emailFailKey)

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

    // Audit log for successful login
    try {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'login_success',
          collection: 'users',
          docId: String(user.id),
          operator: user.id,
          ip,
          reason: '登录成功',
        },
        overrideAccess: true,
      })
    } catch {
      /* ignore */
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
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)
      return unauthorized('invalid_credentials')
    }
    if (msg.includes('not verified') || msg.includes('verify') || msg.includes('验证')) {
      return forbidden('邮箱未验证，请先完成邮箱验证', 'email_not_verified')
    }
    return internalError('登录失败，请稍后重试')
  }
}
