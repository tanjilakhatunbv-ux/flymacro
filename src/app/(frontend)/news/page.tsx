import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'

type NewsItem = {
  id: string
  title: string
  slug: string
  summary?: string
  category?: string
  author?: string
  pinned?: boolean
  publishedAt?: string
  cover?: unknown
}

export const metadata: Metadata = {
  title: '新闻 — FlyMacro',
  description: '魔兽世界插件研发新闻、技术分享与行业资讯。',
}

export const revalidate = 300

export default async function NewsListPage() {
  let articles: NewsItem[] = []
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'news' as never,
      where: { _status: { equals: 'published' } },
      sort: ['-pinned', '-publishedAt'],
      limit: 100,
      depth: 1,
    })
    articles = result.docs as NewsItem[]
  } catch {
    articles = []
  }

  return (
    <div className="container-page page-list">
      <h1>新 闻</h1>
      <p className="page-content">魔兽世界插件研发动态、技术分享与行业资讯。</p>

      {articles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          暂无新闻。
        </p>
      ) : (
        <div className="macro-grid">
          {articles.map((a) => {
            const coverUrl = resolveCoverUrl(a.cover)
            return (
              <Link key={a.id} href={`/news/${a.slug}`} className="macro-card" style={{ display: 'block' }}>
                {coverUrl && (
                  <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px 6px 0 0' }}>
                    <img
                      src={coverUrl}
                      alt={a.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="card-body">
                  <div className="meta">
                    {a.pinned && <span className="tag type-premium">置顶</span>}
                    {a.category && <span className="tag spec">{categoryLabel(a.category)}</span>}
                    {a.publishedAt && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatDate(a.publishedAt)}
                      </span>
                    )}
                  </div>
                  <h3>
                    <span style={{ color: 'var(--gold-bright)' }}>{a.title}</span>
                  </h3>
                  {a.summary && <p className="summary">{a.summary}</p>}
                  {a.author && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                      {a.author}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function categoryLabel(c: string): string {
  switch (c) {
    case 'addon-dev':
      return '插件开发'
    case 'tech-share':
      return '技术分享'
    case 'industry':
      return '行业资讯'
    case 'version-update':
      return '版本动态'
    default:
      return c
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function resolveCoverUrl(cover: unknown): string | null {
  if (!cover) return null
  if (typeof cover === 'string') return cover
  if (typeof cover === 'object' && cover !== null) {
    const c = cover as Record<string, unknown>
    if (typeof c.url === 'string') return c.url
    if (c.sizes && typeof c.sizes === 'object') {
      const sizes = c.sizes as Record<string, unknown>
      if (sizes.thumbnail && typeof sizes.thumbnail === 'object') {
        const thumb = sizes.thumbnail as Record<string, unknown>
        if (typeof thumb.url === 'string') return thumb.url
      }
    }
  }
  return null
}
