import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8')

if (/sslmode=require\b/.test(envExample)) {
  console.error('.env.example must prefer sslmode=verify-full for PostgreSQL TLS verification.')
  process.exit(1)
}

if (!/DATABASE_URI=.*sslmode=verify-full/.test(envExample)) {
  console.error('.env.example DATABASE_URI must include sslmode=verify-full.')
  process.exit(1)
}

console.log('Database example uses verify-full SSL mode.')
