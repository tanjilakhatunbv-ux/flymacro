import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const migrationPath = join(root, 'src/migrations/20260529_repair_credit_package_labels.ts')
const index = readFileSync(join(root, 'src/migrations/index.ts'), 'utf8')

if (!existsSync(migrationPath)) {
  console.error('A follow-up migration must repair already-stored garbled credit package labels.')
  process.exit(1)
}

const migration = readFileSync(migrationPath, 'utf8')

for (const required of [
  "CONCAT(\"credits_granted\", ' 点券包')",
  "LIKE '%???%'",
  "LIKE '%鐐%'",
  '"credits_granted" IS NOT NULL',
]) {
  if (!migration.includes(required)) {
    console.error(`Credit package label repair migration is missing: ${required}`)
    process.exit(1)
  }
}

if (
  !index.includes("import * as migration_20260529_repair_credit_package_labels") ||
  !index.includes("name: '20260529_repair_credit_package_labels'")
) {
  console.error('Credit package label repair migration must be registered in src/migrations/index.ts.')
  process.exit(1)
}

console.log('Credit package label repair migration is present.')
