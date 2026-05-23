import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const configSource = readFileSync(join(process.cwd(), 'src/payload.config.ts'), 'utf8')
const originsPath = join(process.cwd(), 'src/lib/allowed-origins.ts')

if (!existsSync(originsPath)) {
  console.error('Payload CORS/CSRF origins must live in src/lib/allowed-origins.ts so every environment uses one parser.')
  process.exit(1)
}

const originsSource = readFileSync(originsPath, 'utf8')

for (const origin of [
  'http://localhost:3000',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3003',
]) {
  if (!originsSource.includes(origin)) {
    console.error(`Payload CORS/CSRF origins must include ${origin} for local admin login on alternate dev ports.`)
    process.exit(1)
  }
}

if (!originsSource.includes('PAYLOAD_ALLOWED_ORIGINS')) {
  console.error('Payload origins must support PAYLOAD_ALLOWED_ORIGINS for deploy previews and alternate admin domains.')
  process.exit(1)
}

if (!configSource.includes('getPayloadAllowedOrigins') || !/cors:\s*payloadAllowedOrigins/.test(configSource) || !/csrf:\s*payloadAllowedOrigins/.test(configSource)) {
  console.error('Payload config must use getPayloadAllowedOrigins() for both CORS and CSRF.')
  process.exit(1)
}

console.log('Payload local development origins and environment overrides share one parser.')
