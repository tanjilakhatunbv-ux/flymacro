import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/components/AuthForm.tsx'), 'utf8')

if (!source.includes('const formRef = useRef<HTMLFormElement>(null)')) {
  console.error('AuthForm should keep a form ref so the auth button can submit through client code directly.')
  process.exit(1)
}

if (!source.includes('type="button"') || !source.includes('onClick={() => submitCurrentForm()}')) {
  console.error('AuthForm submit button must be type="button" with an explicit client onClick handler.')
  process.exit(1)
}

console.log('AuthForm uses explicit client-side button submission.')
