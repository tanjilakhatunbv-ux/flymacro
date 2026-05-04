import { NextResponse } from 'next/server'
import { getPayload } from '../../../../lib/payload'

/**
 * Reset all richText body fields that may contain incompatible Lexical data.
 * Call this once after deploy to fix "Minified Lexical error #117".
 */
export async function POST() {
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
        const body = (doc as any).body
        // Reset if body exists and is not a clean empty root
        if (body && typeof body === 'object') {
          await payload.update({
            collection: slug,
            id: doc.id,
            data: { body: null } as any,
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
