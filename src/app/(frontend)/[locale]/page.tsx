import Image from 'next/image'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getPayload } from '../../../lib/payload'
import { getCachedClassMacroCounts } from '../../../lib/class-counts'
import { MacroCard } from '../../../components/MacroCard'
import { classSlugs } from '../../../lib/wow'
import type { Macro, Class } from '../../../payload-types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: { absolute: t('title') },
    description: t('description'),
  }
}

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }]
}

export const revalidate = 60

async function loadHomeData() {
  const payload = await getPayload()
  const featured = await payload.find({
    collection: 'macros',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { isFeatured: { equals: true } },
      ],
    },
    sort: ['featuredOrder', '-publishedAt'],
    limit: 6,
    depth: 1,
    overrideAccess: true,
  })
  const classesList = await payload.find({ collection: 'classes', sort: 'sort', limit: 50, depth: 0, overrideAccess: true })
  const counts = await getCachedClassMacroCounts(classesList.docs as Class[])

  return {
    featured: featured.docs as Macro[],
    classes: classesList.docs as Class[],
    counts,
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tWow = await getTranslations({ locale, namespace: 'wow' })
  const { featured, classes, counts } = await loadHomeData()
  const classBySlug = new Map(classes.map((c) => [c.slug, c] as const))

  return (
    <>
      <section className="hero">
        <div className="container-page">
          <span className="hero-rune" aria-hidden="true" />
          <h1>{t('heroTitle')}</h1>
          <p className="lead">{t('heroSubtitle')}</p>
          <div className="hero-actions">
            <Link href="/macros" className="btn btn-primary">
              {t('enterMacros')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2>{t('featuredMacros')}</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" style={{ width: 'auto', height: 'auto' }} />
          </div>
          {featured.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('featuredEmpty')}
            </p>
          ) : (
            <div className="macro-grid">
              {featured.map((m) => (
                <MacroCard key={m.id} macro={m} />
              ))}
            </div>
          )}
          <div className="section-footer">
            <Link href="/macros" className="btn">
              {t('viewAllMacros')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container-page">
          <h2>{t('browseByClass')}</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" style={{ width: 'auto', height: 'auto' }} />
          </div>
          <div className="class-panel">
            {classSlugs.map((slug) => {
              const cls = classBySlug.get(slug)
              const name = locale === 'en'
                ? (cls?.nameEn ?? tWow(slug) ?? slug)
                : (cls?.nameZh ?? tWow(slug) ?? slug)
              const count = counts[slug] ?? 0
              return (
                <Link key={slug} href={`/macros?class=${slug}`} className={`class-tile class-${slug}`}>
                  <span className="class-crest" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/classes/${slug}.svg`} alt="" />
                  </span>
                  <span className="class-name">{name}</span>
                  <span className="class-count">{t('macroCount', { count })}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2>{t('gettingStarted')}</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" style={{ width: 'auto', height: 'auto' }} />
          </div>
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/scroll.svg" width={36} height={36} alt="" />
              </div>
              <h3>{t('featureFree.title')}</h3>
              <p>{t('featureFree.desc')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/swords.svg" width={36} height={36} alt="" />
              </div>
              <h3>{t('featureCoverage.title')}</h3>
              <p>{t('featureCoverage.desc')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/dragon-eye.svg" width={36} height={36} alt="" />
              </div>
              <h3>{t('featureOptimized.title')}</h3>
              <p>{t('featureOptimized.desc')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/shield.svg" width={36} height={36} alt="" />
              </div>
              <h3>{t('featureLegal.title')}</h3>
              <p>{t('featureLegal.desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
