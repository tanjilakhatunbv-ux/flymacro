import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../lib/auth'
import { AccountSideNav } from '../../../components/AccountSideNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?return=/account')

  return (
    <div className="container-page page-single">
      <div className="account-layout">
        <AccountSideNav role={user.role ?? 'user'} />
        <section className="account-content">{children}</section>
      </div>
    </div>
  )
}
