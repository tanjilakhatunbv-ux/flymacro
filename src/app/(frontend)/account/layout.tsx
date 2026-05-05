import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../lib/auth'
import { getPayload } from '../../../lib/payload'
import { AccountSideNav } from '../../../components/AccountSideNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?return=/account')

  const payload = await getPayload()
  const unreadRes = await payload.count({
    collection: 'notifications',
    where: {
      and: [
        { recipient: { equals: user.id } },
        { read: { equals: false } },
      ],
    },
    overrideAccess: true,
  })

  return (
    <div className="container-page page-single">
      <div className="account-layout">
        <AccountSideNav role={user.role ?? 'user'} unreadCount={unreadRes.totalDocs ?? 0} />
        <section className="account-content">{children}</section>
      </div>
    </div>
  )
}
