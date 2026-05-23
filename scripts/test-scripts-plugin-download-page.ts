import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

function expectIncludes(source: string, pattern: string, message: string): void {
  if (!source.includes(pattern)) {
    console.error(message)
    process.exit(1)
  }
}

function expectNotIncludes(source: string, pattern: string, message: string): void {
  if (source.includes(pattern)) {
    console.error(message)
    process.exit(1)
  }
}

const listPage = read('src/app/(frontend)/[locale]/scripts/page.tsx')
const detailPage = read('src/app/(frontend)/[locale]/scripts/[slug]/page.tsx')
const scriptCard = read('src/components/ScriptCard.tsx')
const scriptVersions = read('src/collections/ScriptVersions.ts')
const scriptFiles = read('src/collections/ScriptFiles.ts')
const zhMessages = read('src/messages/zh.json')
const enMessages = read('src/messages/en.json')

expectIncludes(
  listPage,
  "{ type: { equals: 'addon' } }",
  '/scripts list page must only query published addon scripts.',
)

expectIncludes(
  detailPage,
  "{ type: { equals: 'addon' } }",
  '/scripts detail page must reject non-addon scripts.',
)

expectNotIncludes(
  detailPage,
  'findScriptVersions',
  '/scripts detail page must use latestVersion instead of loading public version history.',
)

expectNotIncludes(
  detailPage,
  'versionHistory',
  '/scripts detail page must not render version history.',
)

expectIncludes(
  scriptCard,
  'download={filename ?? true}',
  'Script cards must expose the current plugin file download directly.',
)

expectIncludes(
  scriptCard,
  'formatFileSize',
  'Script cards must show file size for the current downloadable file.',
)

expectIncludes(
  scriptVersions,
  'delete: isOperatorOrAbove',
  'Operators must be allowed to delete script versions.',
)

expectIncludes(
  scriptFiles,
  'delete: isOperatorOrAbove',
  'Operators must be allowed to delete unreferenced script files.',
)

expectIncludes(
  scriptFiles,
  "collection: 'script-versions'",
  'Script file deletion must check for existing version references.',
)

expectNotIncludes(
  zhMessages,
  '"versionHistory"',
  'Chinese script download copy must not expose version history.',
)

expectNotIncludes(
  enMessages,
  '"versionHistory"',
  'English script download copy must not expose version history.',
)

console.log('Scripts plugin download page assertions passed.')
