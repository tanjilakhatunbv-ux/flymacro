import { getPayload } from './payload'
import type { Article, Guide } from '../payload-types'

export type NewsItem = {
  id: string
  title: string
  slug: string
  summary?: string
  category?: string
  author?: string
  pinned?: boolean
  publishedAt?: string
  cover?: unknown
  body?: unknown
}

export async function getPublishedArticles(): Promise<Article[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    sort: ['-pinned', '-publishedAt'],
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as Article[]
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  return (result.docs[0] as Article | undefined) ?? null
}

export async function getPublishedArticleStaticParams(): Promise<Array<{ slug: string }>> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs.map((article: { slug: string }) => ({ slug: article.slug }))
}

export async function getPublishedNewsItems(): Promise<NewsItem[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'news' as never,
    where: { _status: { equals: 'published' } },
    sort: ['-pinned', '-publishedAt'],
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  return result.docs as NewsItem[]
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsItem | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news' as never,
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    return (result.docs[0] as NewsItem | undefined) ?? null
  } catch {
    return null
  }
}

export async function getPublishedNewsStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news' as never,
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    return result.docs.map((item: never) => ({ slug: (item as { slug: string }).slug }))
  } catch {
    return []
  }
}

export async function getPublishedGuides(): Promise<Guide[]> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'guides',
    where: { _status: { equals: 'published' } },
    sort: ['weight', '-publishedAt'],
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs as Guide[]
}

export async function getPublishedGuideBySlug(slug: string): Promise<Guide | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'guides',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  return (result.docs[0] as Guide | undefined) ?? null
}

export async function getPublishedGuideStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'guides',
      where: { _status: { equals: 'published' } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    return result.docs.map((guide: { slug: string }) => ({ slug: guide.slug }))
  } catch {
    return []
  }
}
