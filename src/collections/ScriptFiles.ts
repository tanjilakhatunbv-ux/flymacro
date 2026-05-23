import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove } from '../lib/access'

export const ScriptFiles: CollectionConfig = {
  slug: 'script-files',
  labels: { singular: '脚本文件', plural: '脚本文件' },
  admin: {
    group: '脚本管理',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize', 'updatedAt'],
    description: '脚本文件上传库。步骤：1) 在此处上传文件 2) 去「脚本版本」创建新版本并选择此文件。支持 .lua / .zip / .txt / .json 等格式。',
  },
  access: {
    read: anyone,
    create: isOperatorOrAbove,
    update: isOperatorOrAbove,
    delete: isOperatorOrAbove,
  },
  upload: {
    staticDir: 'script-files',
    mimeTypes: [
      'text/x-lua',
      'application/x-lua',
      'text/plain',
      'text/csv',
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
      'application/octet-stream',
    ],
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      label: '文件说明',
      admin: { description: '简要描述此文件用途' },
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const refs = await req.payload.find({
          collection: 'script-versions',
          where: { scriptFile: { equals: id } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (refs.totalDocs > 0) {
          throw new Error(`无法删除：此文件仍被 ${refs.totalDocs} 个脚本版本引用。请先删除或替换相关版本。`)
        }
      },
    ],
  },
}
