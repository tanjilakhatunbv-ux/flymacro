import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/app/(frontend)/[locale]/page.tsx'), 'utf8')

const dividerImages = source.match(/<Image src="\/images\/ornaments\/gem-divider\.svg"[\s\S]*?\/>/g) ?? []

if (dividerImages.length !== 3) {
  console.error('Home page should render three gem divider images.')
  process.exit(1)
}

for (const image of dividerImages) {
  if (!/style=\{\{\s*width:\s*'auto',\s*height:\s*'auto'\s*\}\}/.test(image)) {
    console.error('Gem divider images must set both width:auto and height:auto to avoid Next image aspect warnings.')
    process.exit(1)
  }
}

console.log('Home divider images preserve aspect ratio without Next image warnings.')
