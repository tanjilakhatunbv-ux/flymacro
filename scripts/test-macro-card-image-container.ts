import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8')

const cardImgRule = css.match(/\.card-img\s*\{(?<body>[\s\S]*?)\}/)?.groups?.body ?? ''

if (!/\bdisplay\s*:\s*block\s*;/.test(cardImgRule)) {
  console.error('Macro card image links must be display:block so aspect-ratio gives next/image fill a non-zero parent height.')
  process.exit(1)
}

if (!/\baspect-ratio\s*:\s*16\s*\/\s*9\s*;/.test(cardImgRule)) {
  console.error('Macro card image links must keep the 16/9 aspect-ratio used by next/image fill.')
  process.exit(1)
}

console.log('Macro card image links provide a stable fill container.')
