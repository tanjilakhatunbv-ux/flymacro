import Link from 'next/link'
import { getCurrentUser } from '../lib/auth'
import { getPayload } from '../lib/payload'
import { UserMenu } from './UserMenu'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/macros', label: '宏库' },
  { href: '/guide', label: '教程' },
  { href: '/blog', label: '公告' },
  { href: '/about', label: '关于' },
]

export async function Header() {
  const user = await getCurrentUser()
  const unread = user ? await countUnreadNotifications(user.id) : 0

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
          {user ? (
            <UserMenu
              email={user.email}
              name={user.name ?? null}
              role={user.role ?? 'user'}
              unread={unread}
              credits={(user.credits as number) ?? 0}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="btn"
                style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

async function countUnreadNotifications(userId: string | number): Promise<number> {
  try {
    const payload = await getPayload()
    const r = await payload.count({
      collection: 'notifications',
      where: { and: [{ recipient: { equals: userId } }, { read: { equals: false } }] },
      overrideAccess: true,
    })
    return r.totalDocs ?? 0
  } catch {
    return 0
  }
}
