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

console.log('Notification API routes use the notification-actions boundary.')
