import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../lib/auth'
import { getPayload } from '../../../../lib/payload'
import { MarkAllReadButton } from '../../../../components/NotificationButtons'
import { MarkNotificationReadForm } from '../../../../components/MarkNotificationReadForm'
import type { Notification } from '../../../../payload-types'

export const metadata: Metadata = {
  title: '通知中心 — FlyMacro',
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload()
  const r = await payload.find({
    collection: 'notifications',
    where: { recipient: { equals: user.id } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const notifications = r.docs as Notification[]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>通知中心</h1>
        {notifications.length > 0 && (
          <MarkAllReadButton />
        )}
      </div>
      <p className="lead">来自系统和客服的最新消息。</p>

      {notifications.length === 0 ? (
        <div className="account-empty">
          <p>没有通知。</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  const read = !!notification.read
  const body = notification.body ?? ''
  const link = notification.link ?? undefined

  const inner = (
    <div className="notif-item" data-read={String(read)}>
      <div className="notif-item-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!read && <span className="notif-unread-dot" aria-hidden="true" />}
          <span className="notif-title">{notification.title}</span>
          {!read && <MarkNotificationReadForm id={String(notification.id)} />}
        </div>
        <span className="notif-time">{formatDate(notification.createdAt)}</span>
      </div>
      {body && <div className="notif-body">{body}</div>}
    </div>
  )

  if (link) {
    return <Link href={link} style={{ textDecoration: 'none' }}>{inner}</Link>
  }
  return inner
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
