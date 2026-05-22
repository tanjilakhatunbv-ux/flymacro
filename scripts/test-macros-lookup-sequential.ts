import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/app/(frontend)/[locale]/macros/page.tsx'), 'utf8')

if (/getLookupTables[\s\S]*Promise\.all/.test(source)) {
  console.error('Macros lookup queries must run sequentially to avoid exhausting the small Postgres connection pool.')
  process.exit(1)
}

console.log('Macros lookup queries run sequentially.')
