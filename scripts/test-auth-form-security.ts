import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/components/AuthForm.tsx'), 'utf8')

if (!/<form[^>]*method="post"[^>]*className="auth-form"/.test(source)) {
  console.error('AuthForm must set method="post" so unhydrated/failed client handling cannot leak passwords into the URL query string.')
  process.exit(1)
}

console.log('AuthForm uses POST fallback for credential forms.')
