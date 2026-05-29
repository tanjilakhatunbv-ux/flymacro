import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/app/(frontend)/[locale]/macros/page.tsx'), 'utf8')

if (/getCachedUserExchangedIds[\s\S]*Promise<Set/.test(source) || /return new Set\(/.test(source)) {
  console.error('Macros user exchange cache must return serializable IDs, not Set instances.')
  process.exit(1)
}

if (!source.includes('new Set(await getCachedUserExchangedIds')) {
  console.error('Macros page should convert cached exchanged ID arrays into a Set at render time.')
  process.exit(1)
}

console.log('Macros exchanged ID cache returns serializable data.')
