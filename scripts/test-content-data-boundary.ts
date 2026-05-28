import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const helperPath = 'src/lib/content-data.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Content data helper must exist.')

const helper = read(helperPath)
for (const exportName of [
  'getPublishedArticles',
  'getPublishedArticleBySlug',
  'getPublishedArticleStaticParams',
  'getPublishedNewsItems',
  'getPublishedNewsBySlug',
  'getPublishedNewsStaticParams',
  'getPublishedGuides',
  'getPublishedGuideBySlug',
  'getPublishedGuideStaticParams',
]) {
  assert(
    helper.includes(`export async function ${exportName}`),
    `Content data helper must export ${exportName}.`,
  )
}

for (const page of [
  'src/app/(frontend)/[locale]/blog/page.tsx',
  'src/app/(frontend)/[locale]/blog/[slug]/page.tsx',
  'src/app/(frontend)/[locale]/news/page.tsx',
  'src/app/(frontend)/[locale]/news/[slug]/page.tsx',
  'src/app/(frontend)/[locale]/guide/page.tsx',
  'src/app/(frontend)/[locale]/guide/[slug]/page.tsx',
]) {
  const source = read(page)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${page} must use content-data instead of importing getPayload directly.`,
  )
  assert(source.includes('content-data'), `${page} must import from content-data.`)
}

console.log('Blog, news, and guide pages use the content-data boundary.')
