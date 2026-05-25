import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const seed = readFileSync(join(root, 'src/scripts/seed-full-demos.ts'), 'utf8')
const match = seed.match(/const CREDIT_PACKAGES = \[([\s\S]*?)\n\]/)

if (!match) {
  console.error('CREDIT_PACKAGES seed block is required.')
  process.exit(1)
}

const block = match[1]
const granted = [...block.matchAll(/creditsGranted:\s*(\d+)/g)].map((m) => Number(m[1]))
const expected = [10, 20, 50, 100, 200, 500]

if (JSON.stringify(granted) !== JSON.stringify(expected)) {
  console.error(`Seed credit packages must grant exactly ${expected.join(', ')} credits; found ${granted.join(', ')}.`)
  process.exit(1)
}

for (const oldValue of [12, 60, 125, 400]) {
  if (block.includes(`creditsGranted: ${oldValue}`) || block.includes(`label: '${oldValue} `)) {
    console.error(`Seed credit packages must not include old bonus pack value ${oldValue}.`)
    process.exit(1)
  }
}

console.log('Credit package seed values use fixed credit packs.')
