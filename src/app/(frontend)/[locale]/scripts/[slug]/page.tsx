import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '../../../../../lib/payload'
import { RichText } from '../../../../../components/RichText'
import { BackLink } from '../../../../../components/BackLink'
import type { Script, ScriptVersion, ScriptFile } from '../../../../../payload-types'

export const revalidate = 3600

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

const findScriptBySlugCached = unstable_cache(
  async (slug: string) => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'scripts',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return (result.docs[0] as Script | undefined) ?? null
  },
  ['script-by-slug-v1'],
  { revalidate: 3600, tags: ['scripts'] },
)

const findScriptVersions = unstable_cache(
  async (scriptId: number | string) => {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'script-versions',
      where: {
        and: [
          { script: { equals: scriptId } },
          { status: { equals: 'published' } },
        ],
      },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs as ScriptVersion[]
  },
  ['script-versions-v1'],
  { revalidate: 3600, tags: ['script-versions'] },
)

export async function generateStaticParams() {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'scripts',
      where: {
        and: [
          { status: { equals: 'published' } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    return result.docs.map((s: { slug: string }) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeSlug(rawSlug)
  const t = await getTranslations('scripts')
  const script = await findScriptBySlugCached(slug)
  if (!script) return { title: t('notFound') }

  return {
    title: `${script.name} — ${t('pageTitle')}`,
    description: script.summary,
    alternates: { canonical: `/scripts/${script.slug}` },
  }
}

function getFileUrl(file: number | ScriptFile | null | undefined): string | null {
  if (!file) return null
  if (typeof file === 'number') return null
  return file.url ?? null
}

function getFileName(file: number | ScriptFile | null | undefined): string | null {
  if (!file) return null
  if (typeof file === 'number') return null
  return file.filename ?? null
}

function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function ScriptDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug: rawSlug, locale } = await params
  const slug = decodeSlug(rawSlug)
  const t = await getTranslations('scripts')
  const script = await findScriptBySlugCached(slug)
  if (!script) notFound()

  const versions = await findScriptVersions(script.id)
  const latestVersion = versions.find((v) => v.isLatest) ?? versions[0]

  const typeMap: Record<string, string> = {
    macro: t('typeMacro'),
    addon: t('typeAddon'),
    tool: t('typeTool'),
    other: t('typeOther'),
  }

  return (
    <div className="container-page page-single">
      <BackLink href="/scripts">{t('backToList')}</BackLink>

      <article className="script-detail">
        <header className="detail-header">
          <h1>{script.name}</h1>
          <div className="detail-meta">
            <span className="tag-chip">{typeMap[script.type] ?? script.type}</span>
            {script.author && <span className="meta-item">{t('author')}: {script.author}</span>}
            {script.publishedAt && (
              <span className="meta-item">
                {t('publishedAt')}: {new Date(script.publishedAt).toLocaleDateString(locale)}
              </span>
            )}
          </div>
        </header>

        {script.summary && (
          <p className="script-summary">{script.summary}</p>
        )}

        {latestVersion && (
          <section className="script-download-section">
            <h2>{t('latestVersion', { version: latestVersion.version })}</h2>
            {latestVersion.changelog && (
              <p className="changelog">{latestVersion.changelog}</p>
            )}
            {(() => {
              const url = getFileUrl(latestVersion.scriptFile)
              const filename = getFileName(latestVersion.scriptFile)
              const file = typeof latestVersion.scriptFile === 'object' ? latestVersion.scriptFile : null
              return url ? (
                <a href={url} download={filename ?? true} className="btn btn-primary download-btn">
                  {t('downloadFile')}
                  {file?.filesize ? ` (${formatFileSize(file.filesize)})` : ''}
                </a>
              ) : (
                <p className="text-muted">{t('noDownload')}</p>
              )
            })()}
          </section>
        )}

        {script.description && (
          <div className="detail-content">
            <RichText content={script.description} />
          </div>
        )}

        {versions.length > 1 && (
          <section className="script-versions-section">
            <h2>{t('versionHistory')}</h2>
            <div className="version-list">
              {versions.map((v) => {
                const url = getFileUrl(v.scriptFile)
                const filename = getFileName(v.scriptFile)
                const file = typeof v.scriptFile === 'object' ? v.scriptFile : null
                return (
                  <div key={v.id} className={`version-item ${v.isLatest ? 'version-latest' : ''}`}>
                    <div className="version-info">
                      <span className="version-number">{v.version}</span>
                      {v.isLatest && <span className="version-badge">{t('latestBadge')}</span>}
                      {v.publishedAt && (
                        <span className="version-date">
                          {new Date(v.publishedAt).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                    {v.changelog && <p className="version-changelog">{v.changelog}</p>}
                    {url ? (
                      <a href={url} download={filename ?? true} className="btn download-btn-sm">
                        {t('downloadFile')}
                        {file?.filesize ? ` (${formatFileSize(file.filesize)})` : ''}
                      </a>
                    ) : (
                      <span className="text-muted">{t('noDownload')}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
