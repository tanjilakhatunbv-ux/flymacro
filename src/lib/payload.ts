import { getPayload as getPayloadInstance } from 'payload'
import config from '../payload.config'

let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null

/**
 * Returns a singleton Payload instance suitable for server-side data fetching
 * inside Next.js Server Components / Route Handlers.
 */
export async function getPayload() {
  if (cached) return cached
  cached = await getPayloadInstance({ config })
  return cached
}
