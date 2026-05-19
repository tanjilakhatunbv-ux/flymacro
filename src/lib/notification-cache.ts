import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'

export const getCachedUnreadCount = unstable_cache(
  async (userId: number) => {
    const payload = await getPayload()
    const r = await payload.count({
      collection: 'notifications',
      where: {
        and: [
          { recipient: { equals: userId } },
          { read: { equals: false } },
        ],
      },
      overrideAccess: true,
    })
    return r.totalDocs ?? 0
  },
  ['unread-count'],
  { revalidate: 30, tags: ['notifications'] },
)
