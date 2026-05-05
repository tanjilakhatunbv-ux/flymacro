import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isOwnerOrSuperAdmin, isSuperAdminField } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
    group: '账号',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    cookies: {
      sameSite: 'Lax',
      secure: true,
    },
    verify: {
      generateEmailHTML: ({ token, user }) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`
        return `<p>你好 ${user?.email ?? ''}，</p>
<p>请点击下方链接验证你的邮箱：</p>
<p><a href="${url}">${url}</a></p>
<p>该链接 24 小时内有效。</p>`
      },
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`
        return `<p>请点击下方链接重置密码：</p>
<p><a href="${url}">${url}</a></p>
<p>该链接 1 小时内有效。如果你没有请求重置密码，请忽略此邮件。</p>`
      },
    },
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin' || user.role === 'operator') return true
      return { id: { equals: user.id } }
    },
    update: isOwnerOrSuperAdmin,
    delete: isSuperAdmin,
    admin: ({ req: { user } }) =>
      !!user && (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: '昵称',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: '头像',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: '超级管理员', value: 'super-admin' },
        { label: '运营', value: 'operator' },
        { label: '客服', value: 'support' },
        { label: '普通用户', value: 'user' },
      ],
      access: {
        update: isSuperAdminField,
      },
      admin: {
        description: '只有超级管理员可以修改角色',
      },
    },
    {
      name: 'oauthProvider',
      type: 'select',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'GitHub', value: 'github' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'oauthId',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'credits',
      type: 'number',
      defaultValue: 20,
      min: 0,
      label: '当前积分',
      admin: { position: 'sidebar', description: '新用户默认 20 积分' },
    },
  ],
  timestamps: true,
}
