'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Role = 'admin' | 'operator' | 'user'

const itemKeys = [
  { href: '/account', labelKey: 'overview' },
  { href: '/account/credits', labelKey: 'credits' },
  { href: '/account/exchanges', labelKey: 'exchanges' },
  { href: '/account/orders', labelKey: 'orders' },
  { href: '/account/transactions', labelKey: 'transactions' },
  { href: '/account/tickets', labelKey: 'tickets' },
  { href: '/account/notifications', labelKey: 'notifications', badge: true },
  { href: '/account/settings', labelKey: 'settings' },
] as const

export function AccountSideNav({ role, unreadCount }: { role: Role; unreadCount: number }) {
  const pathname = usePathname()
  const t = useTranslations('sideNav')
  const isStaff = role === 'admin' || role === 'operator'

  return (
    <aside className="account-side" aria-label={t('navAria')}>
      <h3>{t('accountLabel')}</h3>
      {itemKeys.map((item) => {
        const active =
          item.href === '/account'
            ? pathname === '/account'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const showBadge = 'badge' in item && item.badge && unreadCount > 0
        return (
          <Link key={item.href} href={item.href} className={active ? 'active' : undefined}>
            {t(item.labelKey)}
            {showBadge && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
        )
      })}
      {isStaff && (
        <>
          <h3 style={{ marginTop: '1rem' }}>{t('opsLabel')}</h3>
          <Link href="/admin">{t('opsPanel')}</Link>
        </>
      )}
    </aside>
  )
}
