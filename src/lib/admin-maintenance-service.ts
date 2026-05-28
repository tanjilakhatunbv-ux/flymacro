import { getPayload } from './payload'

const LEXICAL_BODY_COLLECTIONS = [
  { slug: 'pages', label: 'Pages' },
  { slug: 'guides', label: 'Guides' },
  { slug: 'articles', label: 'Articles' },
  { slug: 'tickets', label: 'Tickets' },
] as const

export async function resetIncompatibleLexicalBodies(): Promise<string[]> {
  const payload = await getPayload()
  const results: string[] = []

  for (const { slug, label } of LEXICAL_BODY_COLLECTIONS) {
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
      const message = err instanceof Error ? err.message : String(err)
      results.push(`${label}: ERROR - ${message}`)
    }
  }

  return results
}
