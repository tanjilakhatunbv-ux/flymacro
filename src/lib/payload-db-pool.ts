type PoolConfig = {
  allowExitOnIdle: boolean
  connectionString: string
  connectionTimeoutMillis: number
  idleTimeoutMillis: number
  max: number
}

function integerFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) return fallback

  return Math.min(Math.max(parsed, min), max)
}

export function getPayloadPostgresPool(): PoolConfig {
  const connectionString = process.env.DATABASE_POOLED_URI || process.env.DATABASE_URI || ''

  if (!connectionString) {
    throw new Error('DATABASE_POOLED_URI or DATABASE_URI is required for Payload Postgres.')
  }

  return {
    connectionString,
    // Neon free tier allows a small number of concurrent direct connections.
    // Keep serverless workers conservative, and prefer DATABASE_POOLED_URI in production.
    max: integerFromEnv('DATABASE_POOL_MAX', 5, 1, 5),
    idleTimeoutMillis: integerFromEnv('DATABASE_IDLE_TIMEOUT_MS', 30000, 5000, 120000),
    connectionTimeoutMillis: integerFromEnv('DATABASE_CONNECTION_TIMEOUT_MS', 30000, 10000, 60000),
    allowExitOnIdle: false,
  }
}
