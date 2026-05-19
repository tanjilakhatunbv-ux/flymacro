import type { CollectionConfig, Where } from 'payload'
import { revalidateTag } from 'next/cache'
import { isOperatorOrAbove, isSuperAdmin } from '../lib/access'
import type { UserRole } from '../lib/access'

type AnyUser = { id: string | number; role?: UserRole }

const hasRole = (user: AnyUser | null | undefined, ...roles: UserRole[]) =>
  !!user && !!user.role && roles.includes(user.role)

export const ScriptVersions: CollectionConfig = {
  slug: 'script-versions',
  labels: { singular: '脚本版本', plural: '脚本版本' },
  admin: {
    group: '脚本管理',
    useAsTitle: 'version',
    defaultColumns: ['version', 'script', 'status', 'isLatest', 'publishedAt'],
    description: '脚本版本管理：维护脚本的所有历史版本记录。',
    listSearchableFields: ['version', 'changelog'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (hasRole(user as AnyUser | null, 'admin', 'operator')) return true
      return { status: { equals: 'published' } } as Where
    },
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isSuperAdmin,
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'script',
      type: 'relationship',
      relationTo: 'scripts',
      required: true,
      label: '所属脚本',
      admin: { description: '选择该版本属于哪个脚本项目' },
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      label: '版本号',
      admin: { description: '例如 v1.2.0，建议遵循语义化版本规范' },
    },
    {
      name: 'scriptFile',
      type: 'upload',
      relationTo: 'script-files',
      required: true,
      label: '脚本文件',
      admin: { description: '上传该版本的脚本文件' },
    },
    {
      name: 'scriptType',
      type: 'select',
      required: true,
      defaultValue: 'macro',
      label: '脚本类型',
      options: [
        { label: '宏命令', value: 'macro' },
        { label: '插件', value: 'addon' },
        { label: '工具', value: 'tool' },
        { label: '其他', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'gameVersion',
      type: 'relationship',
      relationTo: 'versions',
      label: '兼容游戏版本',
      admin: { position: 'sidebar', description: '选择适配的魔兽世界版本' },
    },
    {
      name: 'changelog',
      type: 'textarea',
      label: '更新说明',
      maxLength: 4000,
      admin: { description: '该版本相对上一版本的变更内容' },
    },
    {
      name: 'description',
      type: 'richText',
      label: '版本描述',
      admin: { description: '该版本的详细使用说明或文档' },
    },
    {
      name: 'author',
      type: 'text',
      label: '作者',
      admin: { position: 'sidebar', description: '该版本的作者或维护者' },
    },
    {
      name: 'checksum',
      type: 'text',
      label: '文件校验和',
      admin: {
        position: 'sidebar',
        description: 'SHA256 或 MD5，用于文件完整性校验',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: '状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已归档', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布日期',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'isLatest',
      type: 'checkbox',
      defaultValue: false,
      label: '最新版本',
      admin: {
        position: 'sidebar',
        description: '发布时自动标记，同脚本下仅一个最新版本',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Auto-set publishedAt when publishing for the first time
        if (
          (data as Record<string, unknown>).status === 'published' &&
          !originalDoc?.publishedAt &&
          !(data as Record<string, unknown>).publishedAt
        ) {
          ;(data as Record<string, unknown>).publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        // When a version is published and marked as latest, unmark other versions of the same script
        const docData = doc as Record<string, unknown>
        const scriptId = docData.script
        const isLatest = docData.isLatest
        const status = docData.status

        if (
          operation === 'update' &&
          scriptId &&
          isLatest === true &&
          status === 'published'
        ) {
          const prev = previousDoc as Record<string, unknown> | undefined
          const prevIsLatest = prev?.isLatest
          if (prevIsLatest !== true) {
            try {
              const payload = req.payload
              const siblings = await payload.find({
                collection: 'script-versions',
                where: {
                  and: [
                    { script: { equals: scriptId } },
                    { id: { not_equals: docData.id } },
                    { isLatest: { equals: true } },
                  ],
                },
                limit: 100,
                depth: 0,
                overrideAccess: true,
              })
              for (const sib of siblings.docs) {
                await payload.update({
                  collection: 'script-versions',
                  id: ((sib as unknown) as Record<string, unknown>).id as number,
                  data: { isLatest: false },
                  overrideAccess: true,
                })
              }
            } catch {
              /* ignore auto-unmark failures */
            }
          }
        }

        try { revalidateTag('script-versions') } catch { /* ignore */ }
      },
    ],
    afterDelete: [
      async () => {
        try { revalidateTag('script-versions') } catch { /* ignore */ }
      },
    ],
  },
  timestamps: true,
}
