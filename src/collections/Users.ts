import type { CollectionConfig, Where } from 'payload'
import { isAdminField } from '../lib/access'

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
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
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
      if (user.role === 'admin' || user.role === 'operator') return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'operator') {
        return {
          or: [
            { id: { equals: user.id } },
            { role: { equals: 'user' } },
          ],
        } as Where
      }
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'operator') {
        return { role: { equals: 'user' } }
      }
      return false
    },
    admin: ({ req: { user } }) =>
      !!user && (user.role === 'admin' || user.role === 'operator'),
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
        { label: '管理员', value: 'admin' },
        { label: '运营', value: 'operator' },
        { label: '普通用户', value: 'user' },
      ],
      access: {
        update: isAdminField,
      },
      admin: {
        description: '只有管理员可以修改角色',
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
        components: {
          Field: '@/components/admin/StatusField#StatusField',
        },
      },
    },
    {
      name: 'credits',
      type: 'number',
      defaultValue: 20,
      min: 0,
      label: '当前积分',
      admin: {
        position: 'sidebar',
        description: '新用户默认 20 积分',
        components: {
          Field: '@/components/admin/CreditsField#CreditsField',
        },
      },
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
      name: 'resetPassword',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/ResetPasswordButton#ResetPasswordButton',
        },
      },
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
              defaultLimit: 5,
              maxDepth: 0,
              label: '充值订单',
            },
            {
              name: 'creditTransactionsJoin',
              type: 'join',
              collection: 'credit-transactions',
              on: 'user',
              defaultLimit: 5,
              maxDepth: 0,
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
              defaultLimit: 5,
              maxDepth: 0,
              label: '宏兑换记录',
            },
            {
              name: 'ticketsJoin',
              type: 'join',
              collection: 'tickets',
              on: 'user',
              defaultLimit: 5,
              maxDepth: 0,
              label: '提交工单',
            },
            {
              name: 'notificationsJoin',
              type: 'join',
              collection: 'notifications',
              on: 'recipient',
              defaultLimit: 5,
              maxDepth: 0,
              label: '站内通知',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, data, originalDoc, operation }) => {
        const me = req.user as { role?: string; id: string | number } | null
        if (!me) return

        const isStaff = me.role === 'operator'
        if (!isStaff) return

        if (operation === 'create') {
          const dataRole = (data as Record<string, unknown>).role
          if (dataRole && dataRole !== 'user') {
            throw new Error('无权创建/修改非普通用户角色')
          }
          return
        }

        if (operation !== 'update' || !originalDoc) return

        const isSelf = originalDoc.id === me.id
        const targetIsUser = originalDoc.role === 'user'

        // staff 不能修改其他 staff 的资料
        if (!isSelf && !targetIsUser) {
          throw new Error('无权修改该用户资料')
        }

        // staff 不能修改其他用户的密码
        if (!isSelf && (data as Record<string, unknown>).password) {
          throw new Error('无权修改其他用户的密码')
        }

        // staff 不能修改任何人的角色
        const dataRole = (data as Record<string, unknown>).role
        if (dataRole && dataRole !== originalDoc.role) {
          throw new Error('无权创建/修改非普通用户角色')
        }
      },
    ],
    afterChange: [
      async ({ req, operation, doc, previousDoc }) => {
        if (!req.user) return
        try {
          const { getIPFromPayloadReq, sanitizeDoc } = await import('../lib/audit')
          await req.payload.create({
            collection: 'audit-logs',
            data: {
              action: operation === 'create' ? 'create_user' : 'update_user',
              collection: 'users',
              docId: String(doc.id),
              before: previousDoc ? sanitizeDoc(previousDoc) : null,
              after: sanitizeDoc(doc),
              operator: req.user.id,
              ip: getIPFromPayloadReq(req),
            },
            overrideAccess: true,
          })
        } catch {
          /* audit log failure must not block business */
        }
      },
    ],
    afterDelete: [
      async ({ req, doc, id }) => {
        if (!req.user) return
        try {
          const { getIPFromPayloadReq, sanitizeDoc } = await import('../lib/audit')
          await req.payload.create({
            collection: 'audit-logs',
            data: {
              action: 'delete_user',
              collection: 'users',
              docId: String(id),
              before: doc ? sanitizeDoc(doc) : null,
              after: null,
              operator: req.user.id,
              ip: getIPFromPayloadReq(req),
            },
            overrideAccess: true,
          })
        } catch {
          /* ignore */
        }
      },
    ],
  },
  timestamps: true,
}
