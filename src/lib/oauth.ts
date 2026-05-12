import crypto from 'crypto'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export function isGoogleOAuthConfigured(): boolean {
  return !!googleClientId && !!googleClientSecret
}

export function isGitHubOAuthConfigured(): boolean {
  return !!githubClientId && !!githubClientSecret
}

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: googleClientId!,
    redirect_uri: `${baseUrl}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string
  id_token?: string
}> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleClientId!,
      client_secret: googleClientSecret!,
      redirect_uri: `${baseUrl}/api/auth/callback/google`,
      grant_type: 'authorization_code',
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Google token exchange failed: ${resp.status} ${text}`)
  }

  return (await resp.json()) as { access_token: string; id_token?: string }
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string
  email: string
  name?: string
  picture?: string
  verified_email?: boolean
}> {
  const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!resp.ok) {
    throw new Error(`Google userinfo failed: ${resp.status}`)
  }

  return (await resp.json()) as {
    id: string
    email: string
    name?: string
    picture?: string
    verified_email?: boolean
  }
}

// ─── GitHub OAuth ───

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: githubClientId!,
    redirect_uri: `${baseUrl}/api/auth/callback/github`,
    scope: 'user:email',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export async function exchangeGitHubCode(code: string): Promise<{
  access_token: string
}> {
  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: githubClientId!,
      client_secret: githubClientSecret!,
      redirect_uri: `${baseUrl}/api/auth/callback/github`,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`GitHub token exchange failed: ${resp.status} ${text}`)
  }

  const data = (await resp.json()) as { access_token?: string; error?: string; error_description?: string }
  if (data.error) {
    throw new Error(`GitHub token error: ${data.error_description || data.error}`)
  }
  if (!data.access_token) {
    throw new Error('GitHub token response missing access_token')
  }
  return { access_token: data.access_token }
}

export async function fetchGitHubUserInfo(accessToken: string): Promise<{
  id: number
  login: string
  name?: string
  avatar_url?: string
}> {
  const resp = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!resp.ok) {
    throw new Error(`GitHub userinfo failed: ${resp.status}`)
  }

  return (await resp.json()) as { id: number; login: string; name?: string; avatar_url?: string }
}

export async function fetchGitHubUserEmail(accessToken: string): Promise<string | null> {
  const resp = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!resp.ok) {
    throw new Error(`GitHub emails failed: ${resp.status}`)
  }

  const emails = (await resp.json()) as Array<{
    email: string
    primary: boolean
    verified: boolean
    visibility: string | null
  }>

  const primary = emails.find((e) => e.primary && e.verified)
  if (primary) return primary.email

  // Only accept verified emails — do not fall back to unverified
  return null
}
