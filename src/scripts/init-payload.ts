import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  await getPayload({ config })
  console.log('[init] Payload initialized, schema should be synced')
  process.exit(0)
}

main().catch((err) => {
  console.error('[init] failed:', err)
  process.exit(1)
})
