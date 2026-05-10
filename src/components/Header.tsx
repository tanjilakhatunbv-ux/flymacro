'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { HeaderAuth } from './HeaderAuth'
import { LanguageSwitcher } from './LanguageSwitcher'

const navKeys = ['home', 'macros', 'plugins', 'guide', 'news', 'blog', 'about'] as const
const navHrefs = ['/', '/macros', '/plugins', '/guide', '/news', '/blog', '/about'] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function Header() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = useLocale()

  // Strip locale prefix for active state matching
  const pathWithoutLocale = locale === 'zh' ? pathname : pathname.replace(/^\/en/, '') || '/'

  return (
    <header className="site-header">
      <div className="container-page">
        <Link href="/" className="site-logo" aria-label="FlyMacro">
          FlyMacro
        </Link>
        <nav className="site-nav" aria-label="主导航">
          {navKeys.map((key, i) => {
            const href = locale === 'zh' ? navHrefs[i] : `/en${navHrefs[i]}`
            return (
              <Link
                key={key}
                href={href}
                className={isActive(pathWithoutLocale, navHrefs[i]) ? 'nav-active' : undefined}
                aria-current={isActive(pathWithoutLocale, navHrefs[i]) ? 'page' : undefined}
              >
                {t(key)}
              </Link>
            )
          })}
          <LanguageSwitcher />
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}
