import { strict as assert } from 'node:assert'
import { resolveContactChannels } from '../src/lib/contact-channels'

const configured = resolveContactChannels({
  enabled: true,
  email: { enabled: true, value: 'support@example.com' },
  telegram: { enabled: true, value: '@flymacro', url: 'https://t.me/flymacro' },
  discord: { enabled: true, value: 'FlyMacro Discord', url: 'https://discord.gg/flymacro' },
  qq: { enabled: true, value: '123456789', note: 'QQ group' },
}, {
  NEXT_PUBLIC_SUPPORT_EMAIL: 'fallback@example.com',
  NEXT_PUBLIC_TELEGRAM_URL: 'https://t.me/fallback',
})

assert.deepEqual(configured.map((channel) => channel.type), ['email', 'telegram', 'discord', 'qq'])
assert.equal(configured[0]?.href, 'mailto:support@example.com')
assert.equal(configured[1]?.href, 'https://t.me/flymacro')
assert.equal(configured[2]?.href, 'https://discord.gg/flymacro')
assert.equal(configured[3]?.href, undefined)

const fallback = resolveContactChannels(undefined, {
  NEXT_PUBLIC_SUPPORT_EMAIL: 'support@flymacro.qzz.io',
  NEXT_PUBLIC_TELEGRAM_URL: 'https://t.me/flymacro',
  NEXT_PUBLIC_DISCORD_URL: 'https://discord.gg/flymacro',
  NEXT_PUBLIC_QQ_CONTACT: '123456789',
})

assert.deepEqual(fallback.map((channel) => channel.type), ['email', 'telegram', 'discord', 'qq'])

const disabled = resolveContactChannels({
  enabled: false,
  email: { enabled: true, value: 'support@example.com' },
  telegram: { enabled: true, value: '@flymacro', url: 'https://t.me/flymacro' },
  discord: { enabled: true, value: 'FlyMacro Discord', url: 'https://discord.gg/flymacro' },
  qq: { enabled: true, value: '123456789' },
})

assert.deepEqual(disabled, [])

console.log('Contact channel settings resolve enabled admin channels and environment fallbacks.')
