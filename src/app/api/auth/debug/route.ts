import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from '../../../../lib/payload'
import { forbidden, internalError } from '../../../../lib/api-response'
import type { User } from '../../../../payload-types'

/**
 * Auth debug endpoint — only available in non-production environments.
 * Returns basic auth state info without exposing secrets or tokens.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return forbidden('debug_not_available_in_production')
  }

  try {
    const payload = await getPayload()

    // Method 1: req.headers
    const auth1 = await payload.auth({ headers: req.headers })

    // Method 2: cookies() API + constructed Headers
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')
    const h2 = new Headers()
    if (tokenCookie) h2.set('cookie', `payload-token=${tokenCookie.value}`)
    const auth2 = tokenCookie ? await payload.auth({ headers: h2 }) : { user: null }

    return NextResponse.json({
      method1: {
        source: 'req.headers',
        user: auth1.user ? { id: (auth1.user as User).id } : null,
      },
      method2: {
        source: 'cookies() API',
        user: auth2.user ? { id: (auth2.user as User).id } : null,
      },
      diagnostics: {
        hasCookieHeader: (req.headers.get('cookie') ?? '').includes('payload-token'),
        hasCookieApi: !!tokenCookie,
        env: process.env.NODE_ENV,
      },
    })
  } catch (err) {
    return internalError('Debug endpoint failed')
  }
}
