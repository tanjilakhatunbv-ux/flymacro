import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return walk(path)
    return path.endsWith('.tsx') || path.endsWith('.ts') ? [path] : []
  })
}

const root = process.cwd()
const layoutPath = join(root, 'src/app/(frontend)/[locale]/layout.tsx')
const layoutSource = readFileSync(layoutPath, 'utf8')
const publicNamespacesBlock = layoutSource.match(/const publicNamespaces = \[([\s\S]*?)\]/)?.[1]

if (!publicNamespacesBlock) {
  console.error('Locale layout must define publicNamespaces for client intl messages.')
  process.exit(1)
}

const publicNamespaces = new Set(
  [...publicNamespacesBlock.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]),
)

const componentFiles = walk(join(root, 'src/components'))
const missing = new Map<string, Set<string>>()

for (const file of componentFiles) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/useTranslations\(['"]([^'"]+)['"]\)/g)) {
    const namespace = match[1]
    if (!publicNamespaces.has(namespace)) {
      const files = missing.get(namespace) ?? new Set<string>()
      files.add(relative(root, file))
      missing.set(namespace, files)
    }
  }
}

if (missing.size > 0) {
  const details = [...missing.entries()]
    .map(([namespace, files]) => `${namespace}: ${[...files].join(', ')}`)
    .join('\n')
  console.error(`Client components use intl namespaces that are not sent to NextIntlClientProvider:\n${details}`)
  process.exit(1)
}

console.log('Client intl namespaces are included in the layout provider.')
