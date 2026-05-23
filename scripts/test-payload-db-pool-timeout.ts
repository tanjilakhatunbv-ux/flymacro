import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const configSource = readFileSync(join(process.cwd(), 'src/payload.config.ts'), 'utf8')
const poolPath = join(process.cwd(), 'src/lib/payload-db-pool.ts')

if (!existsSync(poolPath)) {
  console.error('Payload Postgres pool settings must live in src/lib/payload-db-pool.ts so startup configuration is explicit and testable.')
  process.exit(1)
}

const poolSource = readFileSync(poolPath, 'utf8')
const match = poolSource.match(/connectionTimeoutMillis:\s*integerFromEnv\('DATABASE_CONNECTION_TIMEOUT_MS',\s*(\d+)/)
const timeout = match ? Number(match[1]) : 0

if (timeout < 10000) {
  console.error('Payload Postgres pool must wait at least 30s for remote DB connections to avoid intermittent admin login and public page failures.')
  process.exit(1)
}

if (timeout < 30000) {
  console.error('Payload Postgres pool must default DATABASE_CONNECTION_TIMEOUT_MS to 30000 or higher for cold starts and browser QA bursts.')
  process.exit(1)
}

const maxMatch = poolSource.match(/max:\s*integerFromEnv\('DATABASE_POOL_MAX',\s*(\d+)/)
const defaultMax = maxMatch ? Number(maxMatch[1]) : 0

if (defaultMax < 5) {
  console.error('Payload Postgres pool must default DATABASE_POOL_MAX to at least 5 so browser/admin requests do not starve each other.')
  process.exit(1)
}

for (const envName of ['DATABASE_POOLED_URI', 'DATABASE_CONNECTION_TIMEOUT_MS', 'DATABASE_POOL_MAX']) {
  if (!poolSource.includes(envName)) {
    console.error(`Payload Postgres pool must support ${envName}.`)
    process.exit(1)
  }
}

if (!poolSource.includes('Neon free tier')) {
  console.error('Payload DB pool tuning should keep the Neon connection-limit context documented.')
  process.exit(1)
}

if (!configSource.includes('getPayloadPostgresPool')) {
  console.error('Payload config must load its Postgres pool through getPayloadPostgresPool().')
  process.exit(1)
}

console.log('Payload Postgres pool timeout is resilient for remote database cold starts.')
