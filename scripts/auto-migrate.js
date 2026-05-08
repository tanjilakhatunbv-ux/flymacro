import { spawn } from 'child_process'

/**
 * Auto-run Payload migrations before build.
 * Pipes "y" to handle the interactive "data loss" prompt in CI/non-TTY environments.
 */
const child = spawn('node', ['node_modules/payload/bin.js', 'migrate'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: process.env,
})

child.stdin.write('y\n')
child.stdin.end()

child.on('close', (code) => {
  process.exit(code ?? 0)
})
