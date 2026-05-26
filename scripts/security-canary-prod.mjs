import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const baseUrl = process.env.SECURITY_CANARY_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'https://flymacro.qzz.io'
const reportDir = join(process.cwd(), '.gstack', 'security-reports')

const checks = []

async function runCheck(name, fn) {
  const startedAt = Date.now()
  try {
    const detail = await fn()
    checks.push({ name, ok: true, durationMs: Date.now() - startedAt, detail })
  } catch (error) {
    checks.push({
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      ...(options.headers || {}),
      'user-agent': 'flymacro-security-canary/1.0',
    },
  })
  const body = await response.text().catch(() => '')
  return { response, body }
}

function expectStatus(name, status, allowedStatuses, body) {
  if (!allowedStatuses.includes(status)) {
    throw new Error(`${name} returned ${status}: ${body.slice(0, 180)}`)
  }
  return `status=${status}`
}

await runCheck('unauthenticated user create is forbidden', async () => {
  const { response, body } = await request('/api/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `security-canary-${Date.now()}@example.invalid`,
      password: `SecCanary!${Date.now()}`,
      role: 'admin',
      credits: 999999,
    }),
  })
  return expectStatus('POST /api/users', response.status, [401, 403], body)
})

for (const path of [
  '/api/users',
  '/api/credit-orders',
  '/api/credit-transactions',
  '/api/redeem-codes',
  '/api/macro-exchanges',
  '/api/auth/debug',
]) {
  await runCheck(`anonymous ${path} is not public`, async () => {
    const { response, body } = await request(path)
    return expectStatus(`GET ${path}`, response.status, [401, 403, 404, 405], body)
  })
}

for (const returnUrl of ['https://evil.example/owned', '//evil.example/owned']) {
  await runCheck(`OAuth returnUrl is sanitized: ${returnUrl}`, async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/oauth/google?returnUrl=${encodeURIComponent(returnUrl)}`,
      { redirect: 'manual', headers: { 'user-agent': 'flymacro-security-canary/1.0' } },
    )
    const cookie = decodeURIComponent(response.headers.get('set-cookie') || '')
    if (response.status < 300 || response.status >= 400) {
      throw new Error(`expected redirect, got ${response.status}`)
    }
    if (!cookie.includes('"returnUrl":"/account"')) {
      throw new Error('state cookie did not normalize external returnUrl to /account')
    }
    return `status=${response.status}`
  })
}

const failed = checks.filter((check) => !check.ok)
const generatedAt = new Date().toISOString()
const report = { generatedAt, baseUrl, passed: failed.length === 0, checks }
const lines = [
  '# Production Security Canary',
  '',
  `Generated: ${generatedAt}`,
  `Target: ${baseUrl}`,
  `Result: ${failed.length === 0 ? 'PASS' : 'FAIL'}`,
  '',
  ...checks.map((check) => `- ${check.ok ? 'PASS' : 'FAIL'} ${check.name} (${check.durationMs}ms): ${check.detail}`),
  '',
]

await mkdir(reportDir, { recursive: true })
await writeFile(join(reportDir, 'prod-security-canary-latest.json'), `${JSON.stringify(report, null, 2)}\n`)
await writeFile(join(reportDir, 'prod-security-canary-latest.md'), `${lines.join('\n')}\n`)

for (const line of lines.slice(5)) {
  if (line) console.log(line)
}

if (failed.length > 0) {
  process.exit(1)
}
