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

const helperPath = 'src/lib/ticket-data.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Ticket data helper must exist at src/lib/ticket-data.ts.')

const helper = read(helperPath)
for (const exportName of [
  'getAccountTickets',
  'getAccountTicketDetail',
]) {
  assert(
    helper.includes(`export async function ${exportName}`),
    `Ticket data helper must export ${exportName}.`,
  )
}

for (const page of [
  'src/app/(frontend)/[locale]/account/tickets/page.tsx',
  'src/app/(frontend)/[locale]/account/tickets/[id]/page.tsx',
]) {
  const source = read(page)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${page} must read ticket data through src/lib/ticket-data.ts instead of importing getPayload directly.`,
  )
  assert(
    source.includes('ticket-data'),
    `${page} must import its ticket read model from ticket-data.`,
  )
}

console.log('Account ticket pages use the ticket-data boundary.')
