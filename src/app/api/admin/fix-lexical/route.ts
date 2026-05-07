import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'
import { getCurrentUser, isStaffRole } from '../../../../lib/auth'
import { env } from '../../../../lib/env'
import { unauthorized } from '../../../../lib/api-response'

/**
 * Reset all richText body fields that may contain incompatible Lexical data.
 * Call this once after deploy to fix "Minified Lexical error #117".
 * Requires either a valid CRON_SECRET or staff authentication.
 */
export async function POST(req: Request) {
  // Check CRON_SECRET first
  const secret = env.CRON_SECRET
  const provided = req.headers.get('x-cron-secret')

  let authorized = false
  if (secret && provided === secret) {
    authorized = true
  } else {
    // Fallback: check staff auth
    const user = await getCurrentUser()
    if (user && isStaffRole(user)) {
      authorized = true
    }
  }

  if (!authorized) {
    return unauthorized('Authentication required')
  }

  const payload = await getPayload()
  const results: string[] = []

  const collections = [
    { slug: 'pages', label: 'Pages' },
    { slug: 'guides', label: 'Guides' },
    { slug: 'articles', label: 'Articles' },
    { slug: 'tickets', label: 'Tickets' },
  ] as const

  for (const { slug, label } of collections) {
    try {
      const docs = await payload.find({
        collection: slug,
        limit: 1000,
        depth: 0,
        overrideAccess: true,
      })

      let fixed = 0
      for (const doc of docs.docs) {
        const body = (doc as unknown as Record<string, unknown>).body
        // Reset if body exists and is not a clean empty root
        if (body && typeof body === 'object') {
          await payload.update({
            collection: slug,
            id: doc.id,
            data: { body: null } as unknown as Record<string, unknown>,
            overrideAccess: true,
          })
          fixed++
        }
      }
      results.push(`${label}: reset ${fixed} document(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push(`${label}: ERROR — ${msg}`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
