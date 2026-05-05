import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayload } from '../../../lib/payload'
import type { Guide } from '../../../payload-types'

export const metadata: Metadata = {
  title: '教程 — FlyMacro',
  description: '学习编写魔兽世界宏与插件的入门教程。',
}

export const revalidate = 300

export default async function GuideListPage() {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'guides',
    where: { _status: { equals: 'published' } },
    sort: ['weight', '-publishedAt'],
    limit: 100,
    depth: 0,
  })
  const guides = result.docs as Guide[]

  return (
    <div className="container-page page-list">
      <h1>教 程</h1>
      <p className="page-content">从零开始学习宏，看懂、写好、用得熟练。</p>

      {guides.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          教程内容正在编写中，敬请期待。
        </p>
      ) : (
        <ul className="macro-grid">
          {guides.map((g) => (
            <li key={g.id}>
              <Link href={`/guide/${g.slug}`} className="card" style={{ display: 'block' }}>
                <article className="macro-card">
                  <div className="card-body">
                    <h3>
                      <span style={{ color: 'var(--gold-bright)' }}>{g.title}</span>
                    </h3>
                    {g.summary && <p className="summary">{g.summary}</p>}
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
