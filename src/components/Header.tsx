'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeaderAuth } from './HeaderAuth'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/macros', label: '宏库' },
  { href: '/plugins', label: '插件' },
  { href: '/guide', label: '教程' },
  { href: '/news', label: '新闻' },
  { href: '/blog', label: '公告' },
  { href: '/about', label: '关于' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="site-header">
      <div className="container-page">
        <Link href="/" className="site-logo" aria-label="FlyMacro">
          FlyMacro
        </Link>
        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? 'nav-active' : undefined}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}
