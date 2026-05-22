import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'
import { classSlugs } from './wow'
import type { Macro, Class } from '../payload-types'

const getCachedPublishedMacroClassRefs = unstable_cache(
  async () => {
    const payload = await getPayload()
    const macrosRes = await payload.find({
      collection: 'macros',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
      select: { classes: true },
      overrideAccess: true,
    })

    return macrosRes.docs as Partial<Macro>[]
  },
  ['home-published-macro-class-refs'],
  { revalidate: 300, tags: ['macros'] },
)

export async function getCachedClassMacroCounts(classes: Class[]) {
  const macros = await getCachedPublishedMacroClassRefs()

  const classIdToSlug = new Map<string | number, string>()
  for (const c of classes) {
    classIdToSlug.set(c.id, c.slug)
  }

  const counts: Record<string, number> = {}
  for (const slug of classSlugs) counts[slug] = 0

  for (const macro of macros) {
    const macroClasses = macro.classes
    if (Array.isArray(macroClasses)) {
      for (const clsRef of macroClasses) {
        const clsId = typeof clsRef === 'object' ? clsRef.id : clsRef
        const slug = classIdToSlug.get(clsId)
        if (slug) counts[slug] = (counts[slug] ?? 0) + 1
      }
    }
  }

  return counts
}
