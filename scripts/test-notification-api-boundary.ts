import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const actionsPath = 'src/lib/notification-actions.ts'
assert(existsSync(join(process.cwd(), actionsPath)), 'Notification actions module must exist.')

const actions = read(actionsPath)
for (const exportName of [
  'markNotificationReadForUser',
  'markAllNotificationsReadForUser',
]) {
  assert(
    actions.includes(`export async function ${exportName}`),
    `Notification actions must export ${exportName}.`,
  )
}

const cachePath = 'src/lib/notification-cache.ts'
assert(existsSync(join(process.cwd(), cachePath)), 'Notification cache module must exist.')

const cache = read(cachePath)
assert(
  cache.includes('export const getCachedUnreadCount'),
  'Notification cache must export getCachedUnreadCount.',
)

for (const route of [
  'src/app/api/notifications/mark-read/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
]) {
  const source = read(route)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${route} must use notification-actions instead of importing getPayload directly.`,
  )
  assert(
    source.includes('notification-actions'),
    `${route} must import notification mutation helpers from notification-actions.`,
  )
}

{
  const route = 'src/app/api/auth/unread-count/route.ts'
  const source = read(route)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${route} must use notification-cache instead of importing getPayload directly.`,
  )
  assert(
    source.includes('notification-cache'),
    `${route} must import unread count helper from notification-cache.`,
  )
}

console.log('Notification API routes use the notification-actions boundary.')
