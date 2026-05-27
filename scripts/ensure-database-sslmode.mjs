import { readFile, writeFile } from 'node:fs/promises'

const envPath = process.argv.includes('--env')
  ? process.argv[process.argv.indexOf('--env') + 1]
  : '.env'
const shouldWrite = process.argv.includes('--write')
const shouldPrintValue = process.argv.includes('--print-value')

const content = await readFile(envPath, 'utf8')
const lines = content.split(/\r?\n/)
const index = lines.findIndex((line) => line.startsWith('DATABASE_URI='))

if (index === -1) {
  console.error(`DATABASE_URI is missing in ${envPath}`)
  process.exit(1)
}

const originalLine = lines[index]
const rawValue = originalLine.slice('DATABASE_URI='.length)
const quote = rawValue.startsWith('"') && rawValue.endsWith('"')
  ? '"'
  : rawValue.startsWith("'") && rawValue.endsWith("'")
    ? "'"
    : ''
const value = quote ? rawValue.slice(1, -1) : rawValue

let url
try {
  url = new URL(value)
} catch {
  console.error('DATABASE_URI is not a valid URL')
  process.exit(1)
}

const previous = url.searchParams.get('sslmode')
const normalized = normalizeSslmode(value)

if (shouldWrite && normalized !== value) {
  lines[index] = `DATABASE_URI=${quote}${normalized}${quote}`
  await writeFile(envPath, lines.join('\n'), 'utf8')
}

if (shouldPrintValue) {
  process.stdout.write(normalized)
} else {
  console.log(`DATABASE_URI sslmode: ${previous || 'none'} -> verify-full`)
  console.log(normalized === value ? 'DATABASE_URI already normalized.' : 'DATABASE_URI needs normalization.')
}

function normalizeSslmode(connectionString) {
  const hashIndex = connectionString.indexOf('#')
  const beforeHash = hashIndex === -1 ? connectionString : connectionString.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : connectionString.slice(hashIndex)
  const queryIndex = beforeHash.indexOf('?')

  if (queryIndex === -1) {
    return `${beforeHash}?sslmode=verify-full${hash}`
  }

  const base = beforeHash.slice(0, queryIndex)
  const query = beforeHash.slice(queryIndex + 1)
  const parts = query
    .split('&')
    .filter((part) => part && !part.toLowerCase().startsWith('sslmode='))

  parts.push('sslmode=verify-full')
  return `${base}?${parts.join('&')}${hash}`
}
