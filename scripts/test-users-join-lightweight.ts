import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/collections/Users.ts'), 'utf8')

const joinFields = [
  'creditOrdersJoin',
  'creditTransactionsJoin',
  'macroExchangesJoin',
  'ticketsJoin',
  'notificationsJoin',
]

for (const field of joinFields) {
  const match = source.match(new RegExp(`name:\\s*'${field}'[\\s\\S]*?label:\\s*'[^']+'[\\s\\S]*?\\n\\s*},`))

  if (!match) {
    console.error(`Could not find users join field ${field}.`)
    process.exit(1)
  }

  const block = match[0]
  const defaultLimit = block.match(/defaultLimit:\s*(\d+)/)
  const maxDepth = block.match(/maxDepth:\s*(\d+)/)

  if (!defaultLimit || Number(defaultLimit[1]) > 5) {
    console.error(`Users join field ${field} must set defaultLimit to 5 or less to keep admin login/default reads lightweight.`)
    process.exit(1)
  }

  if (!maxDepth || Number(maxDepth[1]) !== 0) {
    console.error(`Users join field ${field} must set maxDepth: 0 to avoid deep default join hydration.`)
    process.exit(1)
  }
}

console.log('Users join fields are bounded for lightweight admin login/default reads.')
