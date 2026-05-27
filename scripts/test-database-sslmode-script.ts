import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const script = join(root, 'scripts/ensure-database-sslmode.mjs')
const dir = mkdtempSync(join(tmpdir(), 'flymacro-db-ssl-'))
const envPath = join(dir, '.env')

try {
  writeFileSync(envPath, 'DATABASE_URI=postgres://user:pass@example.com/db?sslmode=require\n')

  const output = execFileSync('node', [script, '--env', envPath, '--write'], {
    cwd: root,
    encoding: 'utf8',
  })
  const updated = readFileSync(envPath, 'utf8')

  if (!output.includes('sslmode: require -> verify-full')) {
    console.error('ensure-database-sslmode must report the prior sslmode without printing the URI.')
    process.exit(1)
  }
  if (!updated.includes('sslmode=verify-full')) {
    console.error('ensure-database-sslmode must rewrite DATABASE_URI to sslmode=verify-full.')
    process.exit(1)
  }
  if (!updated.includes('user:pass@example.com')) {
    console.error('ensure-database-sslmode must preserve the original authority text.')
    process.exit(1)
  }
  if (output.includes('user:pass@example.com')) {
    console.error('ensure-database-sslmode must not print the DATABASE_URI by default.')
    process.exit(1)
  }

  const value = execFileSync('node', [script, '--env', envPath, '--print-value'], {
    cwd: root,
    encoding: 'utf8',
  })
  if (!value.includes('sslmode=verify-full')) {
    console.error('--print-value must emit the normalized DATABASE_URI for Vercel env updates.')
    process.exit(1)
  }
  if (!value.includes('user:pass@example.com')) {
    console.error('--print-value must not rewrite unrelated DATABASE_URI parts.')
    process.exit(1)
  }

  console.log('Database sslmode normalization script passed.')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
