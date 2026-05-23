const DEFAULT_LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3003',
]

const PRODUCTION_ORIGINS = ['https://flymacro.qzz.io']

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    return url.origin
  } catch {
    return null
  }
}

function splitOrigins(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin))
}

export function getServerUrl(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SERVER_URL || '')
  if (configured) return configured

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return normalizeOrigin(vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`) || 'http://localhost:3000'
  }

  return 'http://localhost:3000'
}

export function getPayloadAllowedOrigins(): string[] {
  const vercelOrigin = process.env.VERCEL_URL
    ? normalizeOrigin(process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
    : null

  return [
    getServerUrl(),
    ...DEFAULT_LOCAL_ORIGINS,
    ...PRODUCTION_ORIGINS,
    vercelOrigin,
    ...splitOrigins(process.env.PAYLOAD_ALLOWED_ORIGINS),
  ].filter((origin, index, origins): origin is string => Boolean(origin) && origins.indexOf(origin) === index)
}

export function assertPayloadOriginAllowed(serverUrl = getServerUrl(), allowedOrigins = getPayloadAllowedOrigins()): void {
  if (!allowedOrigins.includes(serverUrl)) {
    throw new Error(
      `Payload serverURL origin ${serverUrl} is not listed in CORS/CSRF origins. Add it to PAYLOAD_ALLOWED_ORIGINS.`,
    )
  }
}
