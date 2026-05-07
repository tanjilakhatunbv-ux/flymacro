import { createHmac } from 'crypto'

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (padded.length % 4)
  const base64 = padding !== 4 ? padded + '='.repeat(padding) : padded
  return Buffer.from(base64, 'base64').toString('utf8')
}

export function verifyJwt(
  token: string,
  secret: string,
): { valid: boolean; payload: Record<string, unknown>; expired: boolean } {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const signingInput = `${headerB64}.${payloadB64}`
  const expectedSig = createHmac('sha256', secret).update(signingInput).digest('base64url')
  const payload = JSON.parse(base64UrlDecode(payloadB64))
  const now = Math.floor(Date.now() / 1000)
  const expired = payload.exp ? payload.exp < now : false
  return { valid: signatureB64 === expectedSig, payload, expired }
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  opts: { expiresInSeconds?: number } = {},
): string {
  const { expiresInSeconds = 60 * 60 * 24 * 7 } = opts
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload))
  const signingInput = `${headerB64}.${payloadB64}`
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url')

  return `${headerB64}.${payloadB64}.${signature}`
}
