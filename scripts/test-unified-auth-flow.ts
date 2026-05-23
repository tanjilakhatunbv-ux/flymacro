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

const authPagePath = 'src/app/(frontend)/[locale]/auth/page.tsx'
assert(existsSync(join(process.cwd(), authPagePath)), 'Unified /auth page must exist.')

const headerAuth = read('src/components/HeaderAuth.tsx')
assert(
  headerAuth.includes('href="/auth?mode=login"'),
  'Header auth button must point to the unified /auth login mode.',
)
assert(
  !headerAuth.includes('href="/auth?mode=register"'),
  'Header auth must expose one unified entry instead of separate login and register buttons.',
)
assert(
  (headerAuth.match(/href="\/auth\?mode=login"/g) ?? []).length === 1,
  'Header auth must render exactly one unified auth link.',
)
assert(
  /href="\/auth\?mode=login"\s+prefetch=\{false\}/.test(headerAuth),
  'Header auth link must keep prefetch disabled after moving to /auth.',
)

const authForm = read('src/components/AuthForm.tsx')
assert(
  authForm.includes('href="/auth?mode=register"') && authForm.includes('href="/auth?mode=login"'),
  'AuthForm footer links must switch modes on the unified /auth page.',
)

const loginPage = read('src/app/(frontend)/[locale]/login/page.tsx')
assert(
  loginPage.includes("redirect(`/auth?${params.toString()}`)"),
  'Legacy /login page must redirect to /auth?mode=login while preserving safe query params.',
)

const registerPage = read('src/app/(frontend)/[locale]/register/page.tsx')
assert(
  registerPage.includes("redirect(`/auth?${params.toString()}`)"),
  'Legacy /register page must redirect to /auth?mode=register while preserving safe query params.',
)

const authPage = read(authPagePath)
assert(
  authPage.includes("const mode = sp.mode === 'register' ? 'register' : 'login'"),
  'Unified auth page must derive login/register mode from the mode search param.',
)
assert(
  authPage.includes('<AuthForm mode={mode}') && authPage.includes('<AuthModeTabs mode={mode}'),
  'Unified auth page must render shared tabs and pass the selected mode into AuthForm.',
)

console.log('Unified auth flow routes and links are wired.')
