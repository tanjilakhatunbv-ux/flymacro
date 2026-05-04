import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../lib/auth'
import { AccountSideNav } from '../../../components/AccountSideNav'

export default async function AccountLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams: Promise<{ paid?: string }>
}) {
  const user = await getCurrentUser()
  const sp = await searchParams
  // Allow payment return callbacks (user may have lost cookie during 3rd-party checkout)
  const isPaymentReturn = sp.paid === 'success' || sp.paid === 'cancel'
  if (!user && !isPaymentReturn) redirect('/login?return=/account')

  return (
    <div className="container-page page-single">
      <div className="account-layout">
        <AccountSideNav role={user.role ?? 'user'} />
        <section className="account-content">{children}</section>
      </div>
    </div>
  )
}
