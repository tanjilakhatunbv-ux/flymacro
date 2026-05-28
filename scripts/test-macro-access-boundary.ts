import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

const helperPath = 'src/lib/macro-access.ts'
assert(existsSync(join(process.cwd(), helperPath)), 'Macro access helper must exist at src/lib/macro-access.ts.')

const helper = read(helperPath)
for (const exportName of [
  'getActiveExchangeMacroIds',
  'getMacroExchangeStatus',
  'getAccessibleMacroCode',
]) {
  assert(
    helper.includes(`export async function ${exportName}`),
    `Macro access helper must export ${exportName}.`,
  )
}

for (const route of [
  'src/app/api/macro/my-exchanges/route.ts',
  'src/app/api/macro/exchange-status/route.ts',
  'src/app/api/macro/code/route.ts',
]) {
  const source = read(route)
  assert(
    !source.includes('/lib/payload') && !source.includes('getPayload'),
    `${route} must use macro-access helpers instead of importing getPayload directly.`,
  )
  assert(source.includes('macro-access'), `${route} must import from macro-access.`)
}

console.log('Low-risk macro access API routes use the macro-access boundary.')
