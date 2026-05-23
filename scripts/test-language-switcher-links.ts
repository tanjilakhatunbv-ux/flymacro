import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/components/LanguageSwitcher.tsx'), 'utf8')

if (!source.includes('Link')) {
  console.error('LanguageSwitcher must render real links so language changes work before hydration.')
  process.exit(1)
}

if (source.includes('useRouter') || source.includes('router.replace')) {
  console.error('LanguageSwitcher must not rely on router.replace for the primary language switch action.')
  process.exit(1)
}

if (source.includes("'use client'") || source.includes('"use client"')) {
  console.error('LanguageSwitcher should avoid its own client boundary so the native menu remains usable before hydration.')
  process.exit(1)
}

if (source.includes('useState') || source.includes('useEffect')) {
  console.error('LanguageSwitcher must not require React state/effects to open the language menu.')
  process.exit(1)
}

if (!source.includes('<details') || !source.includes('<summary')) {
  console.error('LanguageSwitcher must use native details/summary so the menu opens before hydration.')
  process.exit(1)
}

if (!/locale="zh"/.test(source) || !/locale="en"/.test(source)) {
  console.error('LanguageSwitcher must expose explicit zh and en locale links.')
  process.exit(1)
}

console.log('Language switcher renders hydration-safe locale links.')
