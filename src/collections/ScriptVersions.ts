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
    description: '脚本版本管理。流程：1) 选择所属脚本项目 2) 填写版本号（如 v1.0.0）3) 选择已上传的脚本文件 4) 状态设为「已发布」即可自动标记为最新版并同步到脚本项目。',
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
      admin: { description: '建议格式：v1.0.0、v1.2.3。第一位是大版本，第二位是功能更新，第三位是修复补丁。' },
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
        description: '首次发布时会自动勾选。勾选后该版本会成为脚本的「最新版本」，前台会优先展示。',
        disabled: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
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
        const docData = doc as Record<string, unknown>
        const rawScript = docData.script
        const scriptId = typeof rawScript === 'object' && rawScript !== null
          ? (rawScript as Record<string, unknown>).id as number | string
          : rawScript as number | string
        const isLatest = docData.isLatest
        const status = docData.status
        const versionId = docData.id as number | string

        if (!scriptId || !versionId) {
          try { revalidateTag('script-versions') } catch { /* ignore */ }
          return
        }

        if (req.context?.scriptVersionInternalUpdate) {
          try { revalidateTag('script-versions') } catch { /* ignore */ }
          return
        }

        if (status === 'published') {
          // Any newly published version should become the latest
          let shouldPromote = false
          if (operation === 'create') {
            // New version created as published — always promote
            shouldPromote = true
          } else {
            // Existing version updated — promote if status just changed to published
            const prev = previousDoc as Record<string, unknown> | undefined
            const wasPublished = prev?.status === 'published'
            if (!wasPublished) {
              shouldPromote = true
            }
          }

          if (shouldPromote) {
            // Unmark all other latest versions for this script
            try {
              const siblings = await req.payload.find({
                collection: 'script-versions',
                where: {
                  and: [
                    { script: { equals: scriptId } },
                    { id: { not_equals: versionId } },
                    { isLatest: { equals: true } },
                  ],
                },
                limit: 100,
                depth: 0,
                overrideAccess: true,
              })
              for (const sib of siblings.docs) {
                const sibId = ((sib as unknown) as Record<string, unknown>).id as number
                if (!req.context) req.context = {}
                req.context.scriptVersionInternalUpdate = true
                try {
                  await req.payload.update({
                    collection: 'script-versions',
                    id: sibId,
                    data: { isLatest: false },
                    overrideAccess: true,
                    req,
                  })
                } finally {
                  delete req.context.scriptVersionInternalUpdate
                }
              }
            } catch (err) {
              delete req.context?.scriptVersionInternalUpdate
              req.payload.logger.error({ err, msg: 'Error unmarking sibling script-versions' })
            }

            // Mark self as latest if not already
            if (!isLatest) {
              try {
                if (!req.context) req.context = {}
                req.context.scriptVersionInternalUpdate = true
                const updated = await req.payload.update({
                  collection: 'script-versions',
                  id: versionId,
                  data: { isLatest: true },
                  overrideAccess: true,
                  req,
                })
                delete req.context.scriptVersionInternalUpdate
                req.payload.logger.info(`Set isLatest=true for script-version ${versionId}, result isLatest=${updated.isLatest}`)
              } catch (err) {
                delete req.context?.scriptVersionInternalUpdate
                req.payload.logger.error({ err, msg: 'Error setting isLatest on script-version' })
              }
            }

            // Update parent script's latestVersion
            try {
              if (!req.context) req.context = {}
              req.context.scriptVersionInternalUpdate = true
              await req.payload.update({
                collection: 'scripts',
                id: scriptId as number,
                data: { latestVersion: versionId as number },
                overrideAccess: true,
                req,
              })
              delete req.context.scriptVersionInternalUpdate
            } catch (err) {
              delete req.context?.scriptVersionInternalUpdate
              req.payload.logger.error({ err, msg: 'Error updating parent script latestVersion' })
            }
          }
        }

        try { revalidateTag('script-versions') } catch { /* ignore */ }
        try { revalidateTag('scripts') } catch { /* ignore */ }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const docData = doc as Record<string, unknown>
        const rawScript = docData.script
        const scriptId = typeof rawScript === 'object' && rawScript !== null
          ? (rawScript as Record<string, unknown>).id as number | string
          : rawScript as number | string
        const wasLatest = docData.isLatest === true

        if (wasLatest && scriptId) {
          try {
            const remaining = await req.payload.find({
              collection: 'script-versions',
              where: {
                and: [
                  { script: { equals: scriptId } },
                  { status: { equals: 'published' } },
                ],
              },
              sort: '-publishedAt',
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })

            if (remaining.docs.length > 0) {
              const newLatest = remaining.docs[0] as unknown as Record<string, unknown>
              const newLatestId = newLatest.id as number

              if (!req.context) req.context = {}
              req.context.scriptVersionInternalUpdate = true
              await req.payload.update({
                collection: 'script-versions',
                id: newLatestId,
                data: { isLatest: true },
                overrideAccess: true,
                req,
              })
              delete req.context.scriptVersionInternalUpdate

              await req.payload.update({
                collection: 'scripts',
                id: scriptId as number,
                data: { latestVersion: newLatestId },
                overrideAccess: true,
                req,
              })
            } else {
              await req.payload.update({
                collection: 'scripts',
                id: scriptId as number,
                data: { latestVersion: null as unknown as number },
                overrideAccess: true,
                req,
              })
            }
          } catch {
            /* ignore */
          }
        }

        try { revalidateTag('script-versions') } catch { /* ignore */ }
        try { revalidateTag('scripts') } catch { /* ignore */ }
      },
    ],
  },
  timestamps: true,
}
