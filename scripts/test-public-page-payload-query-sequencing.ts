import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const checks = [
  {
    file: 'src/app/(frontend)/[locale]/page.tsx',
    pattern: /loadHomeData[\s\S]*Promise\.all/,
    message: 'Home page Payload queries must run sequentially to avoid exhausting the small Postgres connection pool.',
  },
  {
    file: 'src/app/(frontend)/[locale]/page.tsx',
    pattern: /browseByClass|class-panel|getCachedClassMacroCounts/,
    message: 'Home page must not render or query the browse-by-class section.',
  },
  {
    file: 'src/messages/en.json',
    pattern: /browseByClass|macroCount/,
    message: 'Home page messages must not keep browse-by-class copy.',
  },
  {
    file: 'src/messages/zh.json',
    pattern: /browseByClass|macroCount/,
    message: 'Home page messages must not keep browse-by-class copy.',
  },
  {
    file: 'src/lib/class-counts.ts',
    pattern: /payload\.find[\s\S]*Promise\.all|Promise\.all[\s\S]*payload\.find/,
    message: 'Class count lookup must not run Payload queries in parallel.',
  },
  {
    file: 'src/app/(frontend)/[locale]/credits/page.tsx',
    pattern: /payload\.find[\s\S]*Promise\.all|Promise\.all[\s\S]*(payload\.find|payload\.findGlobal)/,
    message: 'Credits page Payload queries must run sequentially to avoid connection spikes.',
  },
]

for (const check of checks) {
  const source = readFileSync(join(process.cwd(), check.file), 'utf8')
  if (check.pattern.test(source)) {
    console.error(check.message)
    process.exit(1)
  }
}

console.log('Public page Payload queries run sequentially.')
