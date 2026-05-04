'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { getPayload } from './payload'

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

  const oldPassword = String(formData.get('oldPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const fieldErrors: Record<string, string> = {}
  if (!oldPassword) fieldErrors.oldPassword = '请输入当前密码'
  if (!newPassword) fieldErrors.newPassword = '请输入新密码'
  else if (newPassword.length < 8) fieldErrors.newPassword = '新密码至少 8 位'
  if (newPassword !== confirmPassword) fieldErrors.confirmPassword = '两次输入的新密码不一致'
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

  return { ok: true }
}
