import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const baseUrl = (process.env.CANARY_BASE_URL || 'https://flymacro.qzz.io').replace(/\/$/, '')
const reportDir = join(root, '.gstack/canary-reports')
const chromeTimeoutMs = Number(process.env.CANARY_TIMEOUT_MS || 45_000)

const pages = [
  {
    path: '/',
    signal: 'homepage FlyMacro shell',
    assertion: "document.body.innerText.includes('FlyMacro') && document.querySelectorAll('nav a').length >= 4",
  },
  {
    path: '/macros',
    signal: 'macro library content',
    assertion: "location.pathname.includes('/macros') && document.querySelectorAll('a[href*=\"/macros/\"]').length >= 3",
  },
  {
    path: '/credits',
    signal: 'credit packages page',
    assertion: "document.body.innerText.includes('点券') || document.body.innerText.toLowerCase().includes('credits')",
  },
  {
    path: '/scripts',
    signal: 'scripts listing page',
    assertion: "location.pathname.includes('/scripts') && document.body.innerText.includes('插件下载')",
  },
  {
    path: '/guide',
    signal: 'guide listing page',
    assertion: "location.pathname.includes('/guide') && document.body.innerText.length > 200",
  },
  {
    path: '/news',
    signal: 'news listing page',
    assertion: "location.pathname.includes('/news') && document.body.innerText.length > 200",
  },
  {
    path: '/auth?mode=login',
    signal: 'frontend unified auth login form',
    assertion: "!!document.querySelector('form input[type=\"email\"]') && !!document.querySelector('form input[type=\"password\"]')",
  },
  {
    path: '/admin/login',
    signal: 'Payload admin login form',
    assertion: "!!document.querySelector('input[name=\"email\"], input[type=\"email\"]') && !!document.querySelector('input[name=\"password\"], input[type=\"password\"], input[aria-label=\"密码\"]')",
  },
]

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    join(process.env.USERPROFILE || '', 'AppData/Local/Google/Chrome/Bin/chrome.exe'),
    join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  return candidates.find((candidate) => existsSync(candidate))
}

const chrome = findChrome()
if (!chrome) {
  console.error('Could not find Chrome. Set CHROME_PATH before running canary.')
  process.exit(1)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForExit(child, timeoutMs = 5_000) {
  if (child.exitCode != null || child.signalCode != null) return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function getJson(port, path) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      return await response.json()
    } catch {
      await sleep(100)
    }
  }
  throw new Error('Chrome remote-debugging-port was not ready')
}

function connectWebSocket(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    socket.onopen = () => resolve(socket)
    socket.onerror = (event) => reject(event.error ?? new Error('WebSocket connection failed'))
  })
}

async function openCdpSession(port) {
  const targets = await getJson(port, '/json')
  const target = targets.find((item) => item.type === 'page') || targets[0]
  if (!target?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target')

  const socket = await connectWebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const events = []

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
      return
    }

    if (
      message.method === 'Runtime.exceptionThrown' ||
      message.method === 'Runtime.consoleAPICalled' ||
      message.method === 'Log.entryAdded' ||
      message.method === 'Network.loadingFailed'
    ) {
      events.push(message)
    }
  }

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const messageId = ++id
      pending.set(messageId, resolve)
      socket.send(JSON.stringify({ id: messageId, method, params }))
    })
  }

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Page.enable')

  return { socket, events, send }
}

async function waitForStablePage(send, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let state = null

  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', {
      expression: `(() => ({
        title: document.title,
        href: location.href,
        bodyText: document.body ? document.body.innerText.slice(0, 1200) : '',
        skeletons: document.querySelectorAll('.skeleton-pulse').length,
        readyState: document.readyState
      }))()`,
      returnByValue: true,
    })
    state = result.result?.value ?? result.result?.result?.value ?? result.result?.result

    if (state?.readyState === 'complete' && Number(state.skeletons ?? 0) === 0) return state
    await sleep(300)
  }

  return state
}

function summarizeEvent(event) {
  if (event.method === 'Runtime.exceptionThrown') {
    return event.params?.exceptionDetails?.text || event.params?.exceptionDetails?.exception?.description || 'runtime exception'
  }
  if (event.method === 'Runtime.consoleAPICalled') {
    const type = event.params?.type
    const text = (event.params?.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ')
    return `${type}: ${text}`.trim()
  }
  if (event.method === 'Log.entryAdded') {
    return `${event.params?.entry?.level}: ${event.params?.entry?.text}`
  }
  if (event.method === 'Network.loadingFailed') {
    return `${event.params?.type} ${event.params?.errorText}`
  }
  return event.method
}

function isRelevantFailure(event) {
  if (event.method === 'Runtime.exceptionThrown') return true
  if (event.method === 'Runtime.consoleAPICalled') return ['error', 'warning'].includes(event.params?.type)
  if (event.method === 'Log.entryAdded') return ['error', 'warning'].includes(event.params?.entry?.level)
  if (event.method === 'Network.loadingFailed') {
    return event.params?.errorText && !event.params?.canceled
  }
  return false
}

async function runPageCheck(page) {
  const startedAt = Date.now()
  const url = new URL(page.path, baseUrl).toString()
  const port = 9300 + Math.floor(Math.random() * 1000)
  const userDataDir = join(process.env.TEMP || '/tmp', `flymacro-canary-${process.pid}-${Date.now()}`)
  const chromeProcess = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    const session = await openCdpSession(port)
    const responsePromise = new Promise((resolve) => {
      const handler = (event) => {
        const message = JSON.parse(event.data)
        if (message.method === 'Network.responseReceived' && message.params?.response?.url === url) {
          session.socket.removeEventListener?.('message', handler)
          resolve(message.params.response)
        }
      }
      session.socket.addEventListener?.('message', handler)
    })

    await session.send('Page.navigate', { url })
    const response = await Promise.race([responsePromise, sleep(chromeTimeoutMs).then(() => null)])
    const state = await waitForStablePage(session.send, chromeTimeoutMs)
    const assertion = await session.send('Runtime.evaluate', {
      expression: `Boolean(${page.assertion})`,
      returnByValue: true,
    })
    const hasSignal = Boolean(assertion.result?.result?.value)
    const errors = session.events.filter(isRelevantFailure).map(summarizeEvent)
    const bodyText = state?.bodyText || ''
    const hasErrorPage = /Application error|Internal Server Error|This page could not be found|404: This page|500: Internal/i.test(bodyText)
    const skeletons = Number(state?.skeletons ?? 0)
    const status = response?.status ?? null
    const ok = status === 200 && hasSignal && skeletons === 0 && !hasErrorPage && errors.length === 0

    session.socket.close()
    return {
      path: page.path,
      ok,
      status,
      signal: page.signal,
      hasSignal,
      skeletons,
      hasErrorPage,
      errors,
      totalMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      path: page.path,
      ok: false,
      status: null,
      signal: page.signal,
      hasSignal: false,
      skeletons: null,
      hasErrorPage: false,
      errors: [error instanceof Error ? error.message : String(error)],
      totalMs: Date.now() - startedAt,
    }
  } finally {
    chromeProcess.kill()
    await waitForExit(chromeProcess)
    try {
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
    } catch {
      // Chrome can hold profile files briefly on Windows. The next run uses a fresh directory.
    }
  }
}

mkdirSync(reportDir, { recursive: true })

const checks = []
for (const page of pages) {
  checks.push(await runPageCheck(page))
}

const failed = checks.filter((check) => !check.ok)
const now = new Date().toISOString()
const report = {
  timestamp: now,
  baseUrl,
  checks,
  status: failed.length > 0 ? 'DEGRADED' : 'HEALTHY',
}
const jsonPath = join(reportDir, 'prod-canary-latest.json')
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)

const mdPath = join(reportDir, 'prod-canary-latest.md')
writeFileSync(
  mdPath,
  [
    '# FlyMacro Production Canary',
    '',
    `Timestamp: ${now}`,
    `Target: ${baseUrl}`,
    `Status: ${report.status}`,
    '',
    '| Page | Status | HTTP | Console/Runtime Errors | Skeletons | Total | Signal |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...checks.map((check) => (
      `| ${check.path} | ${check.ok ? 'HEALTHY' : 'DEGRADED'} | ${check.status ?? 'unknown'} | ${check.errors.length} | ${check.skeletons ?? 'unknown'} | ${check.totalMs}ms | ${check.hasSignal ? 'found' : 'missing'}: ${check.signal} |`
    )),
    '',
  ].join('\n'),
)

console.log(`Production canary ${report.status}. Report: ${mdPath}`)
if (failed.length > 0) process.exit(1)
