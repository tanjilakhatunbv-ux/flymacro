import { NextResponse } from 'next/server'
import { rateLimitWithFallback, getClientIP, getCount, incr, del } from '../../../../lib/rate-limit'
import { success, badRequest, unauthorized, forbidden, internalError } from '../../../../lib/api-response'
import { verifyTurnstile } from '../../../../lib/turnstile'
import { setAuthCookie } from '../../../../lib/session'
import {
  findUserByEmail,
  signAuthToken,
  updateLoginMetadata,
  verifyPasswordForUser,
  writeUserAuditLog,
} from '../../../../lib/auth-service'
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

  try {
    // Look up user first for status checks
    const user = await findUserByEmail(normalizedEmail)

    if (!user) {
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)
      return unauthorized('invalid_credentials')
    }

    // Payload returns a token for verified users; unverified users need direct password verification.
    const passwordResult = await verifyPasswordForUser(user, password)
    let token = passwordResult.token

    if (!passwordResult.valid) {
      await incr(ipFailKey, FAIL_TTL)
      await incr(emailFailKey, FAIL_TTL)

      await writeUserAuditLog('login_failed', user, ip, '\u5bc6\u7801\u9519\u8bef')

      const newIpFails = ipFails + 1
      const newEmailFails = emailFails + 1
      if (newIpFails >= FAIL_THRESHOLD || newEmailFails >= FAIL_THRESHOLD) {
        return NextResponse.json(
          { success: false, error: '\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u5b8c\u6210\u4eba\u673a\u9a8c\u8bc1\u540e\u91cd\u8bd5', code: 'captcha_required' },
          { status: 401 },
        )
      }
      return unauthorized('invalid_credentials')
    }

    // Check account status (suspended/banned users cannot log in)
    if (user.status === 'suspended') {
      return forbidden('\u8d26\u53f7\u5df2\u88ab\u505c\u7528\uff0c\u8bf7\u8054\u7cfb\u5ba2\u670d', 'account_suspended')
    }
    if (user.status === 'banned') {
      return forbidden('\u8d26\u53f7\u5df2\u88ab\u5c01\u7981\uff0c\u8bf7\u8054\u7cfb\u5ba2\u670d', 'account_banned')
    }

    // Clear failure counters on success
    await del(ipFailKey, emailFailKey)

    await updateLoginMetadata(user)
    await writeUserAuditLog(
      'login_success',
      user,
      ip,
      user._verified ? '\u767b\u5f55\u6210\u529f' : '\u767b\u5f55\u6210\u529f\uff08\u672a\u9a8c\u8bc1\u90ae\u7bb1\uff09',
    )

    // If Payload did not return a token, sign one directly to bypass Payload's verify gate.
    if (!token) {
      token = await signAuthToken(user)
    }

    // Strip sensitive fields from response
    const {
      hash: _hash,
      salt: _salt,
      resetPasswordToken: _resetPasswordToken,
      resetPasswordExpiration: _resetPasswordExpiration,
      ...safeUser
    } = user as User & Record<string, unknown>

    const response = NextResponse.json(success({
      user: safeUser,
      message: '登录成功',
    }))

    setAuthCookie(response, token)

    return response
  } catch {
    return internalError('登录失败，请稍后重试')
  }
}
