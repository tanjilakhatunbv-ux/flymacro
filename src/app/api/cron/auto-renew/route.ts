import { NextResponse } from 'next/server'
import { env } from '../../../../lib/env'
import { unauthorized, success, internalError } from '../../../../lib/api-response'
import { processDueMacroAutoRenewals } from '../../../../lib/macro-exchange-service'

/**
 * Auto-renew cron job.
 * Should be called once per day (e.g. via Vercel Cron or external scheduler).
 * Renews macro-exchanges where autoRenew=true and expires within 24h.
 */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET
  const url = new URL(req.url)
  const provided = url.searchParams.get('secret') || req.headers.get('x-cron-secret')

  if (!secret) {
    return unauthorized('cron_secret_not_configured')
  }

  if (provided !== secret) {
    return unauthorized('invalid_cron_secret')
  }

  try {
    const result = await processDueMacroAutoRenewals()
    return NextResponse.json(success(result))
  } catch {
    return internalError('Failed to process auto-renew')
  }
}
