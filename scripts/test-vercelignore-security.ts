import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), '.vercelignore'), 'utf8')

for (const required of [
  '.env',
  '.env*',
  '!.env.example',
  '.vercel/',
  '.gstack/',
  '.claude/',
  '.worktrees/',
  'node_modules/',
  '.next/',
]) {
  if (!source.includes(required)) {
    console.error(`.vercelignore must exclude local deployment artifact: ${required}`)
    process.exit(1)
  }
}

console.log('Vercel deployment ignore rules protect local secrets and artifacts.')
