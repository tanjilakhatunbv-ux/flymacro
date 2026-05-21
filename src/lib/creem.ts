const apiKey = process.env.CREEM_API_KEY
const mode = process.env.CREEM_MODE || 'test'

const baseUrl =
  mode === 'live'
    ? 'https://api.creem.io/v1'
    : 'https://test-api.creem.io/v1'

export function isCreemConfigured(): boolean {
  return !!apiKey
}

export async function creemFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!apiKey) throw new Error('CREEM_API_KEY not configured')

  const url = `${baseUrl}${path}`
  const resp = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!resp.ok) {
    let msg = `Creem API error ${resp.status}`
    try {
      const errBody = (await resp.json()) as { message?: string; error?: string }
      msg = errBody.message || errBody.error || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  return (await resp.json()) as T
}

export type CreemCheckoutSession = {
  id: string
  checkout_url: string
  product_id: string
  status: string
}
