import { NextResponse } from 'next/server'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { env } from '../../../../lib/env'
import { unauthorized } from '../../../../lib/api-response'
import { resetIncompatibleLexicalBodies } from '../../../../lib/admin-maintenance-service'

/**
 * Reset all richText body fields that may contain incompatible Lexical data.
 * Call this once after deploy to fix "Minified Lexical error #117".
 * Requires either a valid CRON_SECRET or staff authentication.
 */
export async function POST(req: Request) {
  const secret = env.CRON_SECRET
  const provided = req.headers.get('x-cron-secret')

  let authorized = false
  if (secret && provided === secret) {
    authorized = true
  } else {
    const user = await getCurrentUser()
    if (user && isStaffRole(user)) {
      authorized = true
    }
  }

  if (!authorized) {
    return unauthorized('Authentication required')
  }

  const results = await resetIncompatibleLexicalBodies()
  return NextResponse.json({ ok: true, results })
}
