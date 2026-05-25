export type ContactChannelType = 'email' | 'telegram' | 'discord' | 'qq'

export type ContactChannelSetting = {
  enabled?: boolean | null
  value?: string | null
  url?: string | null
  note?: string | null
}

export type ContactPageSettings = {
  enabled?: boolean | null
  email?: ContactChannelSetting | null
  telegram?: ContactChannelSetting | null
  discord?: ContactChannelSetting | null
  qq?: ContactChannelSetting | null
}

export type ContactChannel = {
  type: ContactChannelType
  label: string
  value: string
  href?: string
  note?: string
}

type ContactEnv = {
  NEXT_PUBLIC_SUPPORT_EMAIL?: string
  NEXT_PUBLIC_TELEGRAM_URL?: string
  NEXT_PUBLIC_DISCORD_URL?: string
  NEXT_PUBLIC_QQ_CONTACT?: string
}

const channelLabels: Record<ContactChannelType, string> = {
  email: 'Email',
  telegram: 'Telegram',
  discord: 'Discord',
  qq: 'QQ',
}

export function resolveContactChannels(
  settings?: ContactPageSettings | null,
  env: ContactEnv = process.env as ContactEnv,
): ContactChannel[] {
  if (settings?.enabled === false) return []

  const channels: ContactChannel[] = []

  addChannel(channels, 'email', settings?.email, {
    value: env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flymacro.qzz.io',
    href: (value) => `mailto:${value}`,
  })
  addChannel(channels, 'telegram', settings?.telegram, {
    value: env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/flymacro',
    href: (value, configuredUrl) => configuredUrl || value,
  })
  addChannel(channels, 'discord', settings?.discord, {
    value: env.NEXT_PUBLIC_DISCORD_URL,
    href: (value, configuredUrl) => configuredUrl || value,
  })
  addChannel(channels, 'qq', settings?.qq, {
    value: env.NEXT_PUBLIC_QQ_CONTACT,
  })

  return channels
}

function addChannel(
  channels: ContactChannel[],
  type: ContactChannelType,
  setting: ContactChannelSetting | null | undefined,
  fallback: {
    value?: string
    href?: (value: string, configuredUrl?: string) => string | undefined
  },
): void {
  const hasAdminSetting = !!setting
  const enabled = hasAdminSetting ? setting?.enabled === true : !!fallback.value
  if (!enabled) return

  const value = trim(setting?.value) || trim(fallback.value)
  if (!value) return

  const configuredUrl = trim(setting?.url)
  const href = fallback.href?.(value, configuredUrl)
  channels.push({
    type,
    label: channelLabels[type],
    value,
    href,
    note: trim(setting?.note),
  })
}

function trim(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}
