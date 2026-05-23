import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

type Env = Record<string, string>

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3003').replace(/\/$/, '')
const routes = ['/', '/macros', '/scripts', '/guide', '/news', '/about', '/login', '/register', '/admin/login']
const serverErrPath = join(process.cwd(), 'server.err.log')
const initialErrSize = existsSync(serverErrPath) ? readFileSync(serverErrPath, 'utf8').length : 0

function loadDotEnv(): Env {
  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return {}

  const env: Env = {}
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    if (match[1].startsWith('#')) continue
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

async function expectOk(pathname: string): Promise<void> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: 'manual',
    headers: { accept: 'text/html,application/xhtml+xml' },
  })

  if (response.status !== 200) {
    throw new Error(`${pathname} returned HTTP ${response.status}`)
  }

  const body = await response.text()
  if (/404|Not Found|Internal Server Error/i.test(body.slice(0, 4000))) {
    throw new Error(`${pathname} rendered an error page`)
  }
}

async function expectPayloadLogin(): Promise<void> {
  const env = { ...loadDotEnv(), ...process.env }
  const email = env.SEED_ADMIN_EMAIL || env.ADMIN_EMAIL
  const password = env.SEED_ADMIN_PASSWORD || env.ADMIN_PASSWORD

  if (!email || !password) {
    console.log('Skipping Payload login POST: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are not configured.')
    return
  }

  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  })

  if (response.status !== 200) {
    throw new Error(`/api/users/login returned HTTP ${response.status}`)
  }

  const setCookie = response.headers.get('set-cookie') || ''
  if (!/payload-token=/.test(setCookie)) {
    throw new Error('/api/users/login did not set the Payload auth cookie')
  }
}

function assertNoNewServerErrors(): void {
  if (!existsSync(serverErrPath)) return

  const after = readFileSync(serverErrPath, 'utf8')
  const added = after.slice(initialErrSize)
  const fatalPattern = /Failed query|Internal Server Error|Connection terminated due to connection timeout|transformAlgorithm is not a function/i

  if (fatalPattern.test(added)) {
    throw new Error('server.err.log captured a new fatal error during critical QA.')
  }
}

for (const route of routes) {
  await expectOk(route)
}

await expectPayloadLogin()
assertNoNewServerErrors()

console.log(`Critical QA passed against ${baseUrl}.`)
