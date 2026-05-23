import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../../lib/auth'
import { getCachedUnreadCount } from '../../../../lib/notification-cache'
import { AccountSideNav } from '../../../../components/AccountSideNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth?mode=login&return=/account')

  const unreadCount = await getCachedUnreadCount(user.id)

  return (
    <div className="container-page page-single">
      <div className="account-layout">
        <AccountSideNav role={user.role ?? 'user'} unreadCount={unreadCount} />
        <section className="account-content">{children}</section>
      </div>
    </div>
  )
}
