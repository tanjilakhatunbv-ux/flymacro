'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'
import { validatePasswordStrength } from './validation'

export type ProfileActionState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }

  const name = String(formData.get('name') ?? '').trim()

  const fieldErrors: Record<string, string> = {}
  if (name.length > 50) fieldErrors.name = '昵称最多 50 字'
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const payload = await getPayload()
  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { name: name || undefined },
      overrideAccess: true,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '保存失败' }
  }

  revalidatePath('/account')
  revalidatePath('/account/settings')
  return { ok: true }
}

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: '请先登录' }
  if (!user._verified) return { error: '请先验证邮箱后再修改密码' }

  const oldPassword = String(formData.get('oldPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const fieldErrors: Record<string, string> = {}
  if (!oldPassword) fieldErrors.oldPassword = '请输入当前密码'
  if (!newPassword) fieldErrors.newPassword = '请输入新密码'
  else {
    const strength = validatePasswordStrength(newPassword)
    if (!strength.ok) fieldErrors.newPassword = strength.error
  }
  if (newPassword !== confirmPassword) fieldErrors.confirmPassword = '两次输入的新密码不一致'
  if (oldPassword && newPassword && oldPassword === newPassword) {
    fieldErrors.newPassword = '新密码不能与当前密码相同'
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const payload = await getPayload()

  // Verify old password by attempting login
  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: oldPassword },
    })
  } catch {
    return { fieldErrors: { oldPassword: '当前密码不正确' } }
  }

  // Update to new password
  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password: newPassword },
      overrideAccess: true,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '密码修改失败' }
  }

  // Audit log for password change
  try {
    const headers = (await import('next/headers')).headers
    const hdrs = await headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
      || hdrs.get('x-real-ip')
      || 'unknown'
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'change_password',
        collection: 'users',
        docId: String(user.id),
        operator: user.id,
        ip,
        reason: '用户自助修改密码',
      },
      overrideAccess: true,
    })
  } catch {
    /* audit log failure must not block password change */
  }

  return { ok: true }
}
