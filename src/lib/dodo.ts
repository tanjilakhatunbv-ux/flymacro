const apiKey = process.env.DODO_API_KEY
const mode = process.env.DODO_MODE || 'test_mode'

const baseUrl =
  mode === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com'

export function isDodoConfigured(): boolean {
  return !!apiKey
}

export async function dodoFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!apiKey) throw new Error('DODO_API_KEY not configured')

  const url = `${baseUrl}${path}`
  const resp = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!resp.ok) {
    let msg = `DodoPayments API error ${resp.status}`
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

export type DodoCheckoutSession = {
  session_id: string
  checkout_url: string
  status?: string
}
