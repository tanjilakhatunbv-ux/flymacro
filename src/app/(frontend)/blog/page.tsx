import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'
import type { Article } from '../../../payload-types'

export const metadata: Metadata = {
  title: '公告 — FlyMacro',
  description: '产品公告、更新日志与博客内容。',
}

export const revalidate = 60

export default async function BlogListPage() {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    sort: ['-pinned', '-publishedAt'],
    limit: 100,
    depth: 0,
  })
  const articles = result.docs as Article[]

  return (
    <div className="container-page page-list">
      <h1>公 告</h1>
      <p className="page-content">站点最新动态、版本更新与技术文章。</p>

      {articles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          暂无公告。
        </p>
      ) : (
        <div className="macro-grid">
          {articles.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="macro-card" style={{ display: 'block' }}>
              <div className="card-body">
                <div className="meta">
                  {a.pinned && <span className="tag type-premium">置顶</span>}
                  {a.category && <span className="tag spec">{categoryLabel(a.category)}</span>}
                </div>
                <h3>
                  <span style={{ color: 'var(--gold-bright)' }}>{a.title}</span>
                </h3>
                {a.summary && <p className="summary">{a.summary}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function categoryLabel(c: NonNullable<Article['category']>): string {
  switch (c) {
    case 'announcement':
      return '公告'
    case 'blog':
      return '博客'
    case 'changelog':
      return '更新日志'
  }
}
