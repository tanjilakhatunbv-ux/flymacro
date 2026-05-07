import { z } from 'zod'

export const IdParam = z.coerce.number().int().positive().max(1_000_000_000)
export const SlugParam = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

export const EmailParam = z.string().email().max(255)
export const PasswordParam = z.string().min(6).max(128)

export function parseParam<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(value)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: result.error.issues.map((i) => i.message).join(', ') }
}
