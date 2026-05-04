import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import {
  isGoogleOAuthConfigured,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
} from '../../../../../lib/oauth'
import { getPayload } from '../../../../../lib/payload'

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
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
    const tokenData = await exchangeGoogleCode(code)
    accessToken = tokenData.access_token
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  // Fetch user info
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
    const msg = err instanceof Error ? err.message : 'userinfo_failed'
    return NextResponse.redirect(
      new URL(`/login?error=oauth&message=${encodeURIComponent(msg)}`, req.url),
    )
  }

  if (!googleUser.email) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=no_email', req.url),
    )
  }

  const payload = await getPayload()

  // Find existing user by OAuth ID or email
  let user = null

  // Try find by oauthProvider + oauthId
  const byOAuth = await payload.find({
    collection: 'users',
    where: {
      and: [
        { oauthProvider: { equals: 'google' } },
        { oauthId: { equals: googleUser.id } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (byOAuth.docs.length > 0) {
    user = byOAuth.docs[0]
  } else {
    // Try find by email
    const byEmail = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email.toLowerCase() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (byEmail.docs.length > 0) {
      user = byEmail.docs[0]
      // Link OAuth to existing user
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          oauthProvider: 'google',
          oauthId: googleUser.id,
          _verified: true,
        } as never,
        overrideAccess: true,
      })
    } else {
      // Create new user
      user = await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name || undefined,
          role: 'user',
          oauthProvider: 'google',
          oauthId: googleUser.id,
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

  // Generate Payload JWT and set cookie
  const token = await payload.login({
    collection: 'users',
    data: {
      email: user.email,
      password: '', // OAuth users have no password
    },
  })

  // Actually, payload.login requires password. Let's generate the token manually.
  // Or better: use the auth strategy approach. But for now, let's use a workaround.
  // We can call the internal auth to generate a token.

  // Alternative: use payload's auth operation directly
  const authResult = await payload.auth({
    headers: new Headers(),
  })

  // Hmm, we need to set the cookie. Let's use a different approach:
  // Call the local auth operation to get a token, then set it as cookie.

  // Actually, the cleanest way is to use the same mechanism Payload uses for login.
  // Let's call the auth endpoints REST API internally with the user credentials.
  // But OAuth users don't have passwords...

  // Workaround: generate a temporary password for OAuth users or use a custom token.
  // Actually, let's use Payload's internal `jwtSign` or the auth operation.

  // For Payload v3, we can use `req.payload.auth` but we don't have req.
  // Let's use a simpler approach: call the REST API login endpoint.
  // But we don't have password...

  // Best approach: create a custom API route that directly sets the JWT cookie.
  // We need to import the jwtSign from Payload.

  // Actually, let me use a different approach:
  // Call the internal auth strategy to generate a token.

  // For now, let's use a simple workaround:
  // 1. Update the user to set a random password
  // 2. Login with that password
  // 3. Set the cookie

  const tempPassword = crypto.randomUUID()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: tempPassword } as never,
    overrideAccess: true,
  })

  const loginResp = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/users/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: tempPassword }),
    },
  )

  if (!loginResp.ok) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=login_failed', req.url),
    )
  }

  const loginData = (await loginResp.json()) as { token?: string }
  const jwtToken = loginData.token

  if (!jwtToken) {
    return NextResponse.redirect(
      new URL('/login?error=oauth&message=no_token', req.url),
    )
  }

  // Set cookie and redirect
  const response = NextResponse.redirect(
    new URL(parsedState.returnUrl, req.url),
  )

  response.cookies.set('payload-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  // Clear oauth state cookie
  response.cookies.delete('oauth-state')

  return response
}
