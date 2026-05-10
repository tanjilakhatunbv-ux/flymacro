import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentUser } from '../../../../../lib/auth'
import { getPayload } from '../../../../../lib/payload'
import { MarkAllReadButton } from '../../../../../components/NotificationButtons'
import { MarkNotificationReadForm } from '../../../../../components/MarkNotificationReadForm'
import type { Notification } from '../../../../../payload-types'

export const dynamic = 'force-dynamic'

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
        {notifications.some((n) => !n.read) && (
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

  const TitleLink = link ? (
    <Link href={link} className="notif-title" style={{ textDecoration: 'none' }}>
      {notification.title}
    </Link>
  ) : (
    <span className="notif-title">{notification.title}</span>
  )

  const BodyContent = body ? (
    link ? (
      <Link href={link} style={{ color: 'inherit', textDecoration: 'none' }}>
        {body}
      </Link>
    ) : (
      body
    )
  ) : null

  return (
    <div className="notif-item" data-read={String(read)}>
      <div className="notif-item-row">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          {!read && <span className="notif-unread-dot" aria-hidden="true" />}
          {TitleLink}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!read && <MarkNotificationReadForm id={String(notification.id)} />}
          <span className="notif-time">{formatDate(notification.createdAt)}</span>
        </div>
      </div>
      {BodyContent && <div className="notif-body">{BodyContent}</div>}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
