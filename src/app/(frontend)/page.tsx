import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from '../../lib/payload'
import { MacroCard } from '../../components/MacroCard'
import { classNames as classNameDict, classSlugs } from '../../lib/wow'
import type { Macro, Class } from '../../payload-types'

export const revalidate = 60

async function loadHomeData() {
  const payload = await getPayload()
  const [featured, classesList] = await Promise.all([
    payload.find({
      collection: 'macros',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 6,
      depth: 2,
    }),
    payload.find({ collection: 'classes', sort: 'sort', limit: 50, depth: 0 }),
  ])

  const counts: Record<string, number> = {}
  for (const slug of classSlugs) {
    const cls = classesList.docs.find((c) => c.slug === slug)
    if (!cls) {
      counts[slug] = 0
      continue
    }
    const r = await payload.count({
      collection: 'macros',
      where: {
        and: [{ classes: { in: [cls.id] } }, { _status: { equals: 'published' } }],
      },
    })
    counts[slug] = r.totalDocs ?? 0
  }

  return {
    featured: featured.docs as Macro[],
    classes: classesList.docs as Class[],
    counts,
  }
}

export default async function HomePage() {
  const { featured, classes, counts } = await loadHomeData()
  const classBySlug = new Map(classes.map((c) => [c.slug, c] as const))

  return (
    <>
      <section className="hero">
        <div className="container-page">
          <span className="hero-rune" aria-hidden="true" />
          <h1>为你的冒险而生</h1>
          <p className="lead">合法 UI 宏与插件 · 全职业覆盖 · 实战调优</p>
          <div className="hero-actions">
            <Link href="/macros" className="btn btn-primary">
              进入宏库
            </Link>
            <Link href="/guide" className="btn">
              学习编写
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2>精选宏包</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" />
          </div>
          {featured.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              敬请期待 — 第一批宏包正在上线中。
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
              查看全部宏包
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container-page">
          <h2>按职业浏览</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" />
          </div>
          <div className="class-panel">
            {classSlugs.map((slug) => {
              const cls = classBySlug.get(slug)
              const name = cls?.nameZh ?? classNameDict[slug] ?? slug
              const count = counts[slug] ?? 0
              return (
                <Link key={slug} href={`/macros?class=${slug}`} className={`class-tile class-${slug}`}>
                  <span className="class-crest" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/classes/${slug}.svg`} alt="" />
                  </span>
                  <span className="class-name">{name}</span>
                  <span className="class-count">{count} 个宏包</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2>新手入门</h2>
          <div className="section-divider" aria-hidden="true">
            <Image src="/images/ornaments/gem-divider.svg" width={380} height={20} alt="" />
          </div>
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/scroll.svg" width={36} height={36} alt="" />
              </div>
              <h3>免费下载</h3>
              <p>基础宏完全免费，注册即可获得，从此告别繁杂操作。</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/swords.svg" width={36} height={36} alt="" />
              </div>
              <h3>全职业覆盖</h3>
              <p>13 个职业 38 个专精，从战士到唤魔师，每个英雄都有专属宏包。</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/dragon-eye.svg" width={36} height={36} alt="" />
              </div>
              <h3>实战调优</h3>
              <p>200+ 小时副本/竞技场实测，基于优先级判断，响应延迟 &lt;16ms。</p>
            </div>
            <div className="feature">
              <div className="feature-icon" aria-hidden="true">
                <Image src="/images/icons/shield.svg" width={36} height={36} alt="" />
              </div>
              <h3>合法合规</h3>
              <p>仅基于暴雪官方 API 开发，不修改客户端，不会触发反作弊系统。</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
