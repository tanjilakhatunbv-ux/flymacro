import type { MetadataRoute } from 'next'
import { getPayload } from '../lib/payload'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://flymacro.qzz.io'
  const payload = await getPayload()

  // Static pages
  const staticPages = [
    '',
    '/macros',
    '/plugins',
    '/guide',
    '/news',
    '/about',
    '/login',
    '/register',
    '/contact',
    '/credits',
  ]

  const staticEntries = staticPages.flatMap((path) => [
    { url: `${baseUrl}/zh${path}`, lastModified: new Date() },
    { url: `${baseUrl}/en${path}`, lastModified: new Date() },
  ])

  // Macro detail pages
  const macros = await payload.find({
    collection: 'macros',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const macroEntries = macros.docs.flatMap((m: { slug: string; updatedAt: string }) => [
    { url: `${baseUrl}/zh/macros/${m.slug}`, lastModified: new Date(m.updatedAt) },
    { url: `${baseUrl}/en/macros/${m.slug}`, lastModified: new Date(m.updatedAt) },
  ])

  // News pages
  const news = await payload.find({
    collection: 'news',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const newsEntries = news.docs.flatMap((n: { slug: string; updatedAt: string }) => [
    { url: `${baseUrl}/zh/news/${n.slug}`, lastModified: new Date(n.updatedAt) },
    { url: `${baseUrl}/en/news/${n.slug}`, lastModified: new Date(n.updatedAt) },
  ])

  // Guide pages
  const guides = await payload.find({
    collection: 'guides',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const guideEntries = guides.docs.flatMap((g: { slug: string; updatedAt: string }) => [
    { url: `${baseUrl}/zh/guide/${g.slug}`, lastModified: new Date(g.updatedAt) },
    { url: `${baseUrl}/en/guide/${g.slug}`, lastModified: new Date(g.updatedAt) },
  ])

  return [...staticEntries, ...macroEntries, ...newsEntries, ...guideEntries]
}
