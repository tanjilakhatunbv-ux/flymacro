import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const fieldBlock = (source: string, fieldName: string) => {
  const marker = `name: '${fieldName}'`
  const start = source.indexOf(marker)
  assert(start !== -1, `Missing field ${fieldName}`)

  const nextField = source.indexOf('\n    {', start + marker.length)
  return source.slice(start, nextField === -1 ? source.length : nextField)
}

const assertFieldAccess = (
  source: string,
  fieldName: string,
  accessEntries: string[],
  fileName: string,
) => {
  const block = fieldBlock(source, fieldName)
  for (const entry of accessEntries) {
    assert(
      block.includes(entry),
      `${fileName}.${fieldName} must include field-level access entry: ${entry}`,
    )
  }
}

const users = read('src/collections/Users.ts')
assert(users.includes('isAdminField, isStaff, isStaffField'), 'Users must import isStaff and isStaffField.')
assert(
  /access:\s*{\s*create:\s*isStaff/.test(users),
  'Users collection create access must be staff-only so public REST cannot bypass the custom registration flow.',
)
assertFieldAccess(users, 'role', ['create: isAdminField', 'update: isAdminField'], 'Users')
for (const field of [
  'status',
  'credits',
  'lastLoginAt',
  'loginCount',
  'staffNote',
  'oauthProvider',
  'oauthId',
]) {
  assertFieldAccess(users, field, ['create: isStaffField', 'update: isStaffField'], 'Users')
}

const exchanges = read('src/collections/MacroExchanges.ts')
assert(exchanges.includes('isStaffField'), 'MacroExchanges must import isStaffField.')
for (const field of ['user', 'macro', 'creditsSpent', 'grantedAt', 'expiresAt', 'revokedAt']) {
  assertFieldAccess(
    exchanges,
    field,
    ['create: isStaffField', 'update: isStaffField'],
    'MacroExchanges',
  )
}

const tickets = read('src/collections/Tickets.ts')
assert(tickets.includes('isStaffField'), 'Tickets must import isStaffField.')
for (const field of ['status', 'priority', 'relatedOrder', 'assignee', 'closedAt']) {
  assertFieldAccess(tickets, field, ['update: isStaffField'], 'Tickets')
}

const notifications = read('src/collections/Notifications.ts')
assert(notifications.includes('isStaffField'), 'Notifications must import isStaffField.')
for (const field of ['recipient', 'title', 'body', 'link', 'category']) {
  assertFieldAccess(
    notifications,
    field,
    ['create: isStaffField', 'update: isStaffField'],
    'Notifications',
  )
}

const ticketMessages = read('src/collections/TicketMessages.ts')
assert(ticketMessages.includes('isStaffField'), 'TicketMessages must import isStaffField.')
assert(ticketMessages.includes('normalizeTicketOwnerId'), 'TicketMessages must normalize relationship owners.')
assert(ticketMessages.includes('senderType: \'user\''), 'TicketMessages must force user senderType for user-created messages.')
assert(ticketMessages.includes('isInternalNote: false'), 'TicketMessages must force public messages for user-created messages.')
for (const field of ['senderType', 'isInternalNote']) {
  assertFieldAccess(
    ticketMessages,
    field,
    ['create: isStaffField', 'update: isStaffField'],
    'TicketMessages',
  )
}

for (const path of [
  'src/app/api/auth/oauth/google/route.ts',
  'src/app/api/auth/oauth/github/route.ts',
  'src/app/api/auth/callback/google/route.ts',
  'src/app/api/auth/callback/github/route.ts',
]) {
  const source = read(path)
  assert(source.includes('sanitizeReturnUrl'), `${path} must sanitize OAuth return URLs.`)
}

const returnUrlHelper = read('src/lib/return-url.ts')
assert(returnUrlHelper.includes('startsWith(\'//\')'), 'Return URL sanitizer must reject protocol-relative URLs.')
assert(returnUrlHelper.includes('CONTROL_CHAR_PATTERN'), 'Return URL sanitizer must reject control characters.')

const login = read('src/app/api/auth/login/route.ts')
const successStart = login.indexOf('const response = NextResponse.json(success({')
const successEnd = login.indexOf('}))', successStart)
const successBody = login.slice(successStart, successEnd)
assert(successStart !== -1, 'Login route must build a success response.')
assert(!successBody.includes('token'), 'Login response body must not expose the JWT token.')

const register = read('src/app/api/auth/register/route.ts')
assert(register.includes('overrideAccess: true'), 'Custom register route must use overrideAccess after collection create is staff-only.')
assert(register.includes("role: 'user'"), 'Custom register route must force new registrations to role user.')

console.log('Prelaunch security hardening checks passed.')
