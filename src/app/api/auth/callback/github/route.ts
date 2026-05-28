import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authLoginUrl } from '../../../../../lib/auth-urls'
import {
  isGitHubOAuthConfigured,
  exchangeGitHubCode,
  fetchGitHubUserInfo,
  fetchGitHubUserEmail,
} from '../../../../../lib/oauth'
import { resolveOAuthUser } from '../../../../../lib/auth-service'
import { rateLimit, getClientIP } from '../../../../../lib/rate-limit'
import { sanitizeReturnUrl } from '../../../../../lib/return-url'
import { setAuthCookie } from '../../../../../lib/session'

export async function GET(req: Request) {
  if (!isGitHubOAuthConfigured()) {
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
    const tokenData = await exchangeGitHubCode(code)
    accessToken = tokenData.access_token
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(new URL(authLoginUrl(message), req.url))
  }

  let githubUser: { id: number; login: string; name?: string; avatar_url?: string }
  let email: string | null
  try {
    ;[githubUser, email] = await Promise.all([
      fetchGitHubUserInfo(accessToken),
      fetchGitHubUserEmail(accessToken),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'userinfo_failed'
    return NextResponse.redirect(new URL(authLoginUrl(message), req.url))
  }

  if (!email) {
    return NextResponse.redirect(new URL(authLoginUrl('no_verified_email'), req.url))
  }

  const authResult = await resolveOAuthUser({
    provider: 'github',
    oauthId: String(githubUser.id),
    email,
    name: githubUser.name || githubUser.login || undefined,
    ip,
    auditReason: 'GitHub OAuth \u767b\u5f55',
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
