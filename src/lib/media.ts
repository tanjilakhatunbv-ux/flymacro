import type { Media } from '../payload-types'

export function isMedia(value: unknown): value is Media {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'url' in value
  )
}

export function previewUrl(
  media: number | Media | undefined,
  // size option removed — currently not implemented
): string | undefined {
  // size currently unused

  if (!media) return undefined
  if (typeof media === 'number') return undefined
  if (!isMedia(media)) return undefined

  const url = media.url
  if (!url) return undefined

  // If S3/public URL is configured, use it directly
  if (url.startsWith('http')) return url

  // Fallback: construct from server URL
  const base = process.env.NEXT_PUBLIC_SERVER_URL || ''
  return `${base}${url}`
}
