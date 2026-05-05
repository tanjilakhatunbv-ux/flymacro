import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from '../../../../lib/payload'

export async function GET(req: Request) {
  const payload = await getPayload()

  // Method 1: req.headers (Route Handler direct)
  const auth1 = await payload.auth({ headers: req.headers })

  // Method 2: cookies() API + constructed Headers
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('payload-token')
  const h2 = new Headers()
  if (tokenCookie) h2.set('cookie', `payload-token=${tokenCookie.value}`)
  const auth2 = tokenCookie ? await payload.auth({ headers: h2 }) : { user: null }

  // Raw diagnostics
  const reqCookie = req.headers.get('cookie') ?? ''

  return NextResponse.json({
    method1: {
      source: 'req.headers',
      user: auth1.user ? { id: (auth1.user as any).id, email: (auth1.user as any).email } : null,
    },
    method2: {
      source: 'cookies() API',
      user: auth2.user ? { id: (auth2.user as any).id, email: (auth2.user as any).email } : null,
    },
    diagnostics: {
      hasCookieHeader: reqCookie.includes('payload-token'),
      hasCookieApi: !!tokenCookie,
      cookieNames: reqCookie
        .split(';')
        .map((c) => c.trim().split('=')[0])
        .filter(Boolean),
    },
  })
}
