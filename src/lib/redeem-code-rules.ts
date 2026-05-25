import crypto from 'crypto'

export const REDEEM_CODE_PREFIX_BY_CREDITS = {
  10: 'F010',
  20: 'F020',
  50: 'F050',
  100: 'F100',
  200: 'F200',
  500: 'F500',
} as const

export type RedeemCodeCredits = keyof typeof REDEEM_CODE_PREFIX_BY_CREDITS

export const REDEEM_CODE_CREDIT_OPTIONS = Object.entries(REDEEM_CODE_PREFIX_BY_CREDITS).map(
  ([credits, prefix]) => ({
    label: `${credits} credits (${prefix})`,
    value: Number(credits),
  }),
) as Array<{ label: string; value: RedeemCodeCredits }>

const PREFIX_TO_CREDITS = new Map<string, RedeemCodeCredits>(
  Object.entries(REDEEM_CODE_PREFIX_BY_CREDITS).map(([credits, prefix]) => [
    prefix,
    Number(credits) as RedeemCodeCredits,
  ]),
)

const RANDOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeRedeemCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function getRedeemCodePrefix(credits: number): string | null {
  return REDEEM_CODE_PREFIX_BY_CREDITS[credits as RedeemCodeCredits] ?? null
}

export function getRedeemCodeCreditsFromCode(code: string): RedeemCodeCredits | null {
  const normalized = normalizeRedeemCode(code)
  const prefix = normalized.slice(0, 4)
  return PREFIX_TO_CREDITS.get(prefix) ?? null
}

export function assertRedeemCodeMatchesCredits(code: string, credits: number): void {
  const expectedPrefix = getRedeemCodePrefix(credits)
  if (!expectedPrefix) {
    throw new Error('兑换码只支持 10、20、50、100、200、500 点券包')
  }

  const normalized = normalizeRedeemCode(code)
  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(`兑换码前缀必须为 ${expectedPrefix}`)
  }

  const detectedCredits = getRedeemCodeCreditsFromCode(normalized)
  if (detectedCredits !== credits) {
    throw new Error('兑换码前缀与点券额度不一致')
  }
}

export function generateRedeemCode(credits: RedeemCodeCredits): string {
  const prefix = getRedeemCodePrefix(credits)
  if (!prefix) throw new Error('Unsupported redeem code credits')

  return `${prefix}-${randomSegment(4)}-${randomSegment(4)}`
}

function randomSegment(length: number): string {
  const bytes = crypto.randomBytes(length)
  let value = ''
  for (const byte of bytes) {
    value += RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length]
  }
  return value
}
