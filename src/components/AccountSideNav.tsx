'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Role = 'super-admin' | 'operator' | 'support' | 'user'

const items = [
  { href: '/account', label: '总览' },
  { href: '/account/credits', label: '充值积分' },
  { href: '/account/exchanges', label: '我的兑换' },
  { href: '/account/orders', label: '充值记录' },
  { href: '/account/transactions', label: '积分明细' },
  { href: '/account/tickets', label: '我的工单' },
  { href: '/account/notifications', label: '通知中心', badge: true },
  { href: '/account/settings', label: '账号设置' },
]

export function AccountSideNav({ role, unreadCount }: { role: Role; unreadCount: number }) {
  const pathname = usePathname()
  const isStaff = role === 'super-admin' || role === 'operator' || role === 'support'

  return (
    <aside className="account-side" aria-label="个人中心导航">
      <h3>账号</h3>
      {items.map((item) => {
        const active =
          item.href === '/account'
            ? pathname === '/account'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const showBadge = item.badge && unreadCount > 0
        return (
          <Link key={item.href} href={item.href} className={active ? 'active' : undefined}>
            {item.label}
            {showBadge && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
        )
      })}
      {isStaff && (
        <>
          <h3 style={{ marginTop: '1rem' }}>运营</h3>
          <Link href="/admin">运营后台</Link>
        </>
      )}
    </aside>
  )
}
