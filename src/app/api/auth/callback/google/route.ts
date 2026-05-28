import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authLoginUrl } from '../../../../../lib/auth-urls'
import {
  isGoogleOAuthConfigured,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
} from '../../../../../lib/oauth'
import { resolveOAuthUser } from '../../../../../lib/auth-service'
import { rateLimit, getClientIP } from '../../../../../lib/rate-limit'
import { sanitizeReturnUrl } from '../../../../../lib/return-url'
import { setAuthCookie } from '../../../../../lib/session'

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
  }

  const ip = getClientIP(req)
  const limit = rateLimit(`oauth-cb:${ip}`, { max: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return NextResponse.redirect(new URL(authLoginUrl('rate_limited'), req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateParam = searchParams.get('state')

  if (error) {
    return NextResponse.redirect(new URL(authLoginUrl(error), req.url))
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL(authLoginUrl('missing_code_or_state'), req.url))
  }

  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('oauth-state')?.value
  if (!stateCookie) {
    return NextResponse.redirect(new URL(authLoginUrl('state_expired'), req.url))
  }

  let parsedState: { state: string; returnUrl: string }
  try {
    parsedState = JSON.parse(stateCookie)
  } catch {
    return NextResponse.redirect(new URL(authLoginUrl('invalid_state'), req.url))
  }

  if (parsedState.state !== stateParam) {
    return NextResponse.redirect(new URL(authLoginUrl('state_mismatch'), req.url))
  }

  let accessToken: string
  try {
    const tokenData = await exchangeGoogleCode(code)
    accessToken = tokenData.access_token
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(new URL(authLoginUrl(message), req.url))
  }

  let googleUser: {
    id: string
    email: string
    name?: string
    picture?: string
    verified_email?: boolean
  }
  try {
    googleUser = await fetchGoogleUserInfo(accessToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'userinfo_failed'
    return NextResponse.redirect(new URL(authLoginUrl(message), req.url))
  }

  if (!googleUser.email) {
    return NextResponse.redirect(new URL(authLoginUrl('no_email'), req.url))
  }

  const authResult = await resolveOAuthUser({
    provider: 'google',
    oauthId: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    ip,
    auditReason: 'Google OAuth \u767b\u5f55',
  })
  if ('error' in authResult) {
    return NextResponse.redirect(new URL(authLoginUrl(authResult.error), req.url))
  }

  const response = NextResponse.redirect(
    new URL(sanitizeReturnUrl(parsedState.returnUrl), req.url),
  )

  setAuthCookie(response, authResult.token)
  response.cookies.delete('oauth-state')

  return response
}
