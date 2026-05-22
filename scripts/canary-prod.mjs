import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const baseUrl = process.env.CANARY_BASE_URL || 'https://flymacro.qzz.io'
const browseCandidates = [
  join(process.env.USERPROFILE || '', '.gstack/repos/gstack/browse/dist/browse.exe'),
  join(process.env.USERPROFILE || '', '.codex/skills/gstack/browse/dist/browse.exe'),
]
const browse = browseCandidates.find((candidate) => existsSync(candidate))

if (!browse) {
  console.error('Could not find gstack browse.exe. Install or build gstack browse before running canary.')
  process.exit(1)
}

const pages = [
  {
    path: '/',
    signal: 'homepage FlyMacro shell',
    waitFor: 'nav a',
    assertion: "document.body.innerText.includes('FlyMacro') && document.querySelectorAll('nav a').length >= 4",
  },
  {
    path: '/macros',
    signal: 'macro library content',
    waitFor: 'a[href*="/macros/"]',
    assertion: "location.pathname.includes('/macros') && document.querySelectorAll('a[href*=\"/macros/\"]').length >= 3",
  },
  {
    path: '/login',
    signal: 'frontend login form',
    waitFor: 'form input[type="email"]',
    assertion: "!!document.querySelector('form input[type=\"email\"]') && !!document.querySelector('form input[type=\"password\"]')",
  },
  {
    path: '/admin/login',
    signal: 'Payload admin login form',
    waitFor: 'input[type="email"]',
    assertion: "!!document.querySelector('input[name=\"email\"], input[type=\"email\"]') && !!document.querySelector('input[name=\"password\"], input[type=\"password\"]')",
  },
]

function runBrowse(args, input) {
  const result = spawnSync(browse, args, {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 120_000,
  })

  if (result.error) throw result.error
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const reportDir = join(root, '.gstack/canary-reports')
mkdirSync(reportDir, { recursive: true })

const checks = []
let failed = false

for (const page of pages) {
  const url = new URL(page.path, baseUrl).toString()
  const command = [
    ['goto', url],
    ['wait', '--load'],
    ['wait', page.waitFor],
    ['text'],
    ['snapshot', '-i'],
    ['js', page.assertion],
    ['console', '--errors'],
    ['perf'],
  ]
  const result = runBrowse(['chain'], `${JSON.stringify(command)}\n`)
  const output = `${result.stdout}\n${result.stderr}`
  const hasSignal = /\[js\]\s*true/.test(output)
  const hasConsoleErrors = !/\[console\][\s\S]*\(no console errors\)/.test(output)
  const navigatedOk = new RegExp(`\\[goto\\] Navigated to ${escapeRegex(url)} \\(200\\)`).test(output) || /\[goto\] Navigated to .* \(200\)/.test(output)
  const totalMatch = output.match(/total\s+(\d+)ms/)
  const totalMs = totalMatch ? Number(totalMatch[1]) : null
  const ok = result.status === 0 && navigatedOk && hasSignal && !hasConsoleErrors

  checks.push({
    path: page.path,
    ok,
    status: navigatedOk ? 200 : 'unknown',
    signal: page.signal,
    hasSignal,
    hasConsoleErrors,
    totalMs,
  })

  if (!ok) failed = true
}

const now = new Date().toISOString()
const report = {
  timestamp: now,
  baseUrl,
  checks,
  status: failed ? 'DEGRADED' : 'HEALTHY',
}
const jsonPath = join(reportDir, 'prod-canary-latest.json')
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)

const mdPath = join(reportDir, 'prod-canary-latest.md')
writeFileSync(
  mdPath,
  [
    `# FlyMacro Production Canary`,
    ``,
    `Timestamp: ${now}`,
    `Target: ${baseUrl}`,
    `Status: ${report.status}`,
    ``,
    `| Page | Status | Console Errors | Total | Signal |`,
    `| --- | --- | --- | --- | --- |`,
    ...checks.map((check) => (
      `| ${check.path} | ${check.ok ? 'HEALTHY' : 'DEGRADED'} | ${check.hasConsoleErrors ? 'yes' : 'no'} | ${check.totalMs ?? 'unknown'}ms | ${check.hasSignal ? 'found' : 'missing'}: ${check.signal} |`
    )),
    ``,
  ].join('\n'),
)

console.log(`Production canary ${report.status}. Report: ${mdPath}`)
if (failed) process.exit(1)
