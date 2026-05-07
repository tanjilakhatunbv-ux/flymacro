import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isOwnerOrSuperAdmin, isSuperAdminField } from '../lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '用户', plural: '用户' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'credits', '_verified', 'status', 'lastLoginAt', 'createdAt'],
    group: '账号',
    listSearchableFields: ['email', 'name'],
    description: '注册用户管理。支持按角色、状态筛选，点击查看完整档案。',
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
      if (user.role === 'super-admin' || user.role === 'operator' || user.role === 'support') return true
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
      label: '角色',
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: '账号状态',
      options: [
        { label: '正常', value: 'active' },
        { label: '停用', value: 'suspended' },
        { label: '已封禁', value: 'banned' },
      ],
      admin: {
        position: 'sidebar',
        description: '停用或封禁后用户无法登录前台',
      },
    },
    {
      name: 'credits',
      type: 'number',
      defaultValue: 20,
      min: 0,
      label: '当前积分',
      admin: { position: 'sidebar', description: '新用户默认 20 积分' },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: '最后登录时间',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'loginCount',
      type: 'number',
      defaultValue: 0,
      label: '登录次数',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'staffNote',
      type: 'textarea',
      label: '客服备注',
      admin: {
        description: '仅后台可见，不对用户展示',
      },
    },
    {
      name: 'oauthProvider',
      type: 'select',
      label: 'OAuth 提供商',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'GitHub', value: 'github' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'oauthId',
      type: 'text',
      label: 'OAuth ID',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '财务记录',
          fields: [
            {
              name: 'creditOrdersJoin',
              type: 'join',
              collection: 'credit-orders',
              on: 'user',
              label: '充值订单',
            },
            {
              name: 'creditTransactionsJoin',
              type: 'join',
              collection: 'credit-transactions',
              on: 'user',
              label: '积分流水',
            },
          ],
        },
        {
          label: '业务记录',
          fields: [
            {
              name: 'macroExchangesJoin',
              type: 'join',
              collection: 'macro-exchanges',
              on: 'user',
              label: '宏兑换记录',
            },
            {
              name: 'ticketsJoin',
              type: 'join',
              collection: 'tickets',
              on: 'user',
              label: '提交工单',
            },
            {
              name: 'notificationsJoin',
              type: 'join',
              collection: 'notifications',
              on: 'recipient',
              label: '站内通知',
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
