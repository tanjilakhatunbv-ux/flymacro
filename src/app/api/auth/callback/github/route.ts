import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  isGitHubOAuthConfigured,
  exchangeGitHubCode,
  fetchGitHubUserInfo,
  fetchGitHubUserEmail,
} from '../../../../../lib/oauth'
import { getPayload } from '../../../../../lib/payload'
import { signJwt } from '../../../../../lib/jwt'
import type { User } from '../../../../../payload-types'

export async function GET(req: Request) {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 501 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateParam = searchParams.get('state')

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(error)}`, req.url),
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=missing_code_or_state', req.url),
    )
  }

  // Verify state
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('oauth-state')?.value
  if (!stateCookie) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=state_expired', req.url),
    )
  }

  let parsedState: { state: string; returnUrl: string }
  try {
    parsedState = JSON.parse(stateCookie)
  } catch {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=invalid_state', req.url),
    )
  }

  if (parsedState.state !== stateParam) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=state_mismatch', req.url),
    )
  }

  // Exchange code for token
  let accessToken: string
  try {
    const tokenData = await exchangeGitHubCode(code)
    accessToken = tokenData.access_token
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  // Fetch user info
  let githubUser: { id: number; login: string; name?: string; avatar_url?: string }
  let email: string | null
  try {
    ;[githubUser, email] = await Promise.all([
      fetchGitHubUserInfo(accessToken),
      fetchGitHubUserEmail(accessToken),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'userinfo_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  if (!email) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=no_email', req.url),
    )
  }

  const payload = await getPayload()

  // Find existing user by OAuth ID or email
  let user = null

  const byOAuth = await payload.find({
    collection: 'users',
    where: {
      and: [
        { oauthProvider: { equals: 'github' } },
        { oauthId: { equals: String(githubUser.id) } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (byOAuth.docs.length > 0) {
    user = byOAuth.docs[0]
  } else {
    const byEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: email.toLowerCase() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (byEmail.docs.length > 0) {
      user = byEmail.docs[0]
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          oauthProvider: 'github',
          oauthId: String(githubUser.id),
          _verified: true,
        } as never,
        overrideAccess: true,
      })
    } else {
      user = await payload.create({
        collection: 'users',
        data: {
          email: email.toLowerCase(),
          name: githubUser.name || githubUser.login || undefined,
          role: 'user',
          oauthProvider: 'github',
          oauthId: String(githubUser.id),
          _verified: true,
        },
        overrideAccess: true,
      })
    }
  }

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=user_creation_failed', req.url),
    )
  }

  // Generate JWT directly — no temporary password needed
  const userDoc = user as User
  const payloadSecret = (payload as { secret?: string }).secret ?? ''
  const jwtToken = signJwt(
    {
      id: userDoc.id,
      email: userDoc.email,
      collection: 'users',
    },
    payloadSecret,
    { expiresInSeconds: 60 * 60 * 24 * 7 },
  )

  const response = NextResponse.redirect(
    new URL(parsedState.returnUrl, req.url),
  )

  response.cookies.set('payload-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  response.cookies.delete('oauth-state')

  return response
}
