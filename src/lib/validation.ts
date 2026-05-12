import { z } from 'zod'

export const IdParam = z.coerce.number().int().positive().max(1_000_000_000)
export const SlugParam = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

export const EmailParam = z.string().email().max(255)
export const PasswordParam = z.string().min(8).max(128)

/**
 * Validate password strength: min 8 chars + must contain both letters and digits.
 */
export function validatePasswordStrength(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) return { ok: false, error: '密码至少 8 位' }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)

  if (!hasLetter || !hasDigit) {
    return { ok: false, error: '密码需同时包含字母和数字' }
  }
  return { ok: true }
}

export function parseParam<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(value)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: result.error.issues.map((i) => i.message).join(', ') }
}
