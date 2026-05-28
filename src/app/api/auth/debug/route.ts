import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthDebugInfo } from '../../../../lib/auth-service'
import { forbidden, internalError } from '../../../../lib/api-response'

/**
 * Auth debug endpoint. Only available in non-production environments.
 * Returns basic auth state info without exposing secrets or tokens.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return forbidden('debug_not_available_in_production')
  }

  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('payload-token')
    const info = await getAuthDebugInfo({
      requestHeaders: req.headers,
      tokenCookie: tokenCookie?.value,
    })

    return NextResponse.json(info)
  } catch {
    return internalError('Debug endpoint failed')
  }
}
