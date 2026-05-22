'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { HeaderAuth } from './HeaderAuth'
import { LanguageSwitcher } from './LanguageSwitcher'

const navKeys = ['home', 'macros', 'scripts', 'guide', 'news', 'about'] as const
const navHrefs = ['/', '/macros', '/scripts', '/guide', '/news', '/about'] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function Header() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <header className="site-header">
      <div className="container-page">
        <Link href="/" prefetch={false} className="site-logo" aria-label="FlyMacro">
          FlyMacro
        </Link>
        <nav className="site-nav" aria-label={t('mainNav')}>
          {navKeys.map((key, i) => (
            <Link
              key={key}
              href={navHrefs[i]}
              prefetch={false}
              className={isActive(pathname, navHrefs[i]) ? 'nav-active' : undefined}
              aria-current={isActive(pathname, navHrefs[i]) ? 'page' : undefined}
            >
              {t(key)}
            </Link>
          ))}
          <LanguageSwitcher />
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}
