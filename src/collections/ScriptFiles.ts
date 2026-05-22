import type { CollectionConfig } from 'payload'
import { anyone, isOperatorOrAbove, isSuperAdmin } from '../lib/access'

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
    delete: isSuperAdmin,
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
}
