import type { Macro, Media } from '../payload-types'

function isMedia(v: unknown): v is Media {
  return !!v && typeof v === 'object' && 'url' in (v as Record<string, unknown>)
}

function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || '').replace(/\/$/, '')
  if (!base) return path
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

function pickOgImage(macro: Macro): string | null {
  const seo = (macro as unknown as { seo?: { ogImage?: unknown } }).seo
  const og = isMedia(seo?.ogImage) ? seo!.ogImage : null
  if (og) return absoluteUrl(og.sizes?.og?.url ?? og.url ?? null)
  if (isMedia(macro.previewImg)) {
    const p = macro.previewImg
    return absoluteUrl(p.sizes?.og?.url ?? p.sizes?.hero?.url ?? p.url ?? null)
  }
  return null
}

export function MacroJsonLd({ macro }: { macro: Macro }) {
  const ogUrl = pickOgImage(macro)
  const price = macro.price ?? 0
  const description = (macro as unknown as { seo?: { seoDescription?: string | null } }).seo?.seoDescription
    ?? macro.summary
    ?? undefined
  const url = absoluteUrl(`/macros/${macro.slug}`) ?? `/macros/${macro.slug}`

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: macro.title,
    description,
    url,
    sku: macro.slug,
    category: '魔兽世界宏',
    brand: { '@type': 'Brand', name: 'FlyMacro' },
  }
  if (ogUrl) data.image = ogUrl
  data.offers = {
    '@type': 'Offer',
    priceCurrency: 'CNY',
    price: String(price),
    availability: 'https://schema.org/InStock',
    url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
