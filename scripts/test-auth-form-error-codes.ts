import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/components/AuthForm.tsx'), 'utf8')

if (!source.includes('CODE_TO_AUTH_KEY')) {
  console.error('AuthForm must translate API error codes such as invalid_credentials into localized auth messages.')
  process.exit(1)
}

if (!source.includes("invalid_credentials: 'wrongCredentials'")) {
  console.error('AuthForm must map invalid_credentials to auth.wrongCredentials.')
  process.exit(1)
}

console.log('AuthForm translates API error codes.')
