import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'

export async function getLatestPublishedPlugin() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'plugin-releases',
      where: { isPublished: { equals: true } },
      sort: '-publishedAt',
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return (result.docs[0] ?? null) as any
  } catch (err) {
    console.error('[plugins] getLatestPublishedPlugin failed:', err)
    return null
  }
}

export const getCachedLatestPublishedPlugin = unstable_cache(
  getLatestPublishedPlugin,
  ['latest-plugin'],
  { revalidate: 300, tags: ['plugin-releases'] },
)

export async function getPublishedPlugins() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'plugin-releases',
      where: { isPublished: { equals: true } },
      sort: '-publishedAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs as any[]
  } catch (err) {
    console.error('[plugins] getPublishedPlugins failed:', err)
    return []
  }
}

export const getCachedPublishedPlugins = unstable_cache(
  getPublishedPlugins,
  ['published-plugins'],
  { revalidate: 300, tags: ['plugin-releases'] },
)

export type PluginDownloadInfo =
  | { mode: 'file'; url: string; fileName: string; fileSize?: number }
  | { mode: 'link'; url: string; password?: string }
  | null

export function getPluginDownloadInfo(plugin: any): PluginDownloadInfo {
  if (!plugin) return null
  if (plugin.deliveryMode === 'link') {
    return { mode: 'link', url: plugin.cloudUrl, password: plugin.cloudPassword }
  }
  const file = plugin.pluginFile
  if (typeof file === 'object' && file?.url) {
    return {
      mode: 'file',
      url: file.url,
      fileName: file.filename,
      fileSize: file.filesize,
    }
  }
  return null
}
