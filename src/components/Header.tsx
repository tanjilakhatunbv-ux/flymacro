import Link from 'next/link'
import { HeaderAuth } from './HeaderAuth'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/macros', label: '宏库' },
  { href: '/plugins', label: '插件' },
  { href: '/guide', label: '教程' },
  { href: '/blog', label: '公告' },
  { href: '/about', label: '关于' },
]

export function Header() {
  return (
    <header className="site-header">
      <div className="container-page">
        <Link href="/" className="site-logo" aria-label="FlyMacro">
          FlyMacro
        </Link>
        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}
