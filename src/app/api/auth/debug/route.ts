import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from '../../../../lib/payload'
import { createHmac } from 'crypto'

function base64UrlDecode(str: string) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (padded.length % 4)
  const base64 = padding !== 4 ? padded + '='.repeat(padding) : padded
  return Buffer.from(base64, 'base64').toString('utf8')
}

function verifyJwt(token: string, secret: string) {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const signingInput = `${headerB64}.${payloadB64}`
  const expectedSig = createHmac('sha256', secret).update(signingInput).digest('base64url')
  const valid = signatureB64 === expectedSig
  const payload = JSON.parse(base64UrlDecode(payloadB64))
  return { valid, payload }
}

export async function GET(req: Request) {
  const payload = await getPayload()
  const secret = (payload as any).secret || 'UNKNOWN'

  // Method 1: req.headers
  const auth1 = await payload.auth({ headers: req.headers })

  // Method 2: cookies() API + constructed Headers
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('payload-token')
  const h2 = new Headers()
  if (tokenCookie) h2.set('cookie', `payload-token=${tokenCookie.value}`)
  const auth2 = tokenCookie ? await payload.auth({ headers: h2 }) : { user: null }

  // Method 3: manual JWT verification
  let manualVerify: any = { checked: false }
  if (tokenCookie) {
    try {
      const result = verifyJwt(tokenCookie.value, secret)
      manualVerify = { checked: true, valid: result.valid, payload: result.payload }
    } catch (e: any) {
      manualVerify = { checked: true, error: e.message }
    }
  }

  // Method 4: direct DB lookup by decoded ID (skip signature check)
  let dbLookup: any = { checked: false }
  if (manualVerify.payload?.id) {
    try {
      const user = await payload.findByID({
        collection: 'users',
        id: manualVerify.payload.id,
        depth: 0,
      })
      dbLookup = { checked: true, found: !!user, email: (user as any)?.email }
    } catch (e: any) {
      dbLookup = { checked: true, error: e.message }
    }
  }

  // Method 5: signature diagnostics
  let sigDiagnostics: any = { checked: false }
  if (tokenCookie) {
    try {
      const [headerB64, payloadB64, signatureB64] = tokenCookie.value.split('.')
      const signingInput = `${headerB64}.${payloadB64}`
      const expectedSig = createHmac('sha256', secret).update(signingInput).digest('base64url')
      sigDiagnostics = {
        checked: true,
        actualSig: signatureB64,
        expectedSig,
        match: signatureB64 === expectedSig,
        secretLength: secret.length,
        secretPrefix: String(secret).slice(0, 10),
        signingInputPrefix: signingInput.slice(0, 30),
      }
    } catch (e: any) {
      sigDiagnostics = { checked: true, error: e.message }
    }
  }

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
    method3_manualJwt: manualVerify,
    method4_dbLookup: dbLookup,
    method5_sigDiagnostics: sigDiagnostics,
    secretPrefix: String(secret).slice(0, 15) + '...',
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
