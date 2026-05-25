import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(process.cwd(), 'src/components/UserMenu.tsx'), 'utf8')

const triggerMatch = source.match(/<button[\s\S]*?className="user-menu-trigger"[\s\S]*?<\/button>/)
if (!triggerMatch) {
  console.error('UserMenu must render a user-menu-trigger button.')
  process.exit(1)
}

const trigger = triggerMatch[0]

if (trigger.includes('user-badge')) {
  console.error('UserMenu trigger must not show unread notification counts.')
  process.exit(1)
}

if (!trigger.includes('user-menu-chevron')) {
  console.error('UserMenu trigger must include a chevron affordance for the dropdown.')
  process.exit(1)
}

if (!source.includes('user-menu-pip')) {
  console.error('UserMenu dropdown must keep the unread count inside the notifications menu item.')
  process.exit(1)
}

console.log('User menu trigger uses a dropdown affordance without a top-level unread badge.')
