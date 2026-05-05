'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

type MacroFiltersProps = {
  classes: { slug: string; nameZh: string }[]
}

export function MacroFilters({ classes }: MacroFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const tier = (params.get('tier') === 'regular' || params.get('tier') === 'premium')
    ? params.get('tier')!
    : 'all'
  const classSlug = params.get('class') || null

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  return (
    <div aria-busy={isPending}>
      <div className="filters" role="tablist" aria-label="按档次筛选">
        <button
          type="button"
          className={`filter-btn ${tier === 'all' ? 'active' : ''}`}
          onClick={() => setParam('tier', null)}
        >
          全部宏包
        </button>
        <button
          type="button"
          className={`filter-btn ${tier === 'regular' ? 'active' : ''}`}
          onClick={() => setParam('tier', 'regular')}
        >
          普通宏
        </button>
        <button
          type="button"
          className={`filter-btn ${tier === 'premium' ? 'active' : ''}`}
          onClick={() => setParam('tier', 'premium')}
        >
          高级宏
        </button>
      </div>

      <div className="taxonomy-cloud">
        <h3>按职业筛选</h3>
        <div className="tag-cloud">
          <button
            type="button"
            className={`tag-link ${!classSlug ? 'active' : ''}`}
            onClick={() => setParam('class', null)}
          >
            全部
          </button>
          {classes.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`tag-link ${classSlug === c.slug ? 'active' : ''}`}
              onClick={() => setParam('class', c.slug)}
            >
              {c.nameZh}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClearFiltersLink() {
  return (
    <Link href="/macros" className="btn">
      清除筛选
    </Link>
  )
}
