import React from 'react'
import Image from 'next/image'
import { previewUrl } from '../lib/media'

type LexicalNode = {
  type: string
  version?: number
  text?: string
  format?: number | string
  bold?: boolean
  italic?: boolean
  code?: boolean
  children?: LexicalNode[]
  tag?: string
  direction?: string | null
  fields?: Record<string, unknown>
  url?: string
  language?: string
  listType?: 'bullet' | 'number' | 'check'
  start?: number
  value?: number | Record<string, unknown>
  checked?: boolean
  relationTo?: string
  [k: string]: unknown
}

type LexicalRoot = {
  root: {
    type: string
    children: LexicalNode[]
    [k: string]: unknown
  }
}

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 1 << 1
const FORMAT_STRIKETHROUGH = 1 << 2
const FORMAT_UNDERLINE = 1 << 3
const FORMAT_CODE = 1 << 4
const FORMAT_SUBSCRIPT = 1 << 5
const FORMAT_SUPERSCRIPT = 1 << 6

function renderText(node: LexicalNode, key: number): React.ReactNode {
  let el: React.ReactNode = node.text ?? ''
  const fmt = typeof node.format === 'number' ? node.format : 0
  const isBold = node.bold === true || !!(fmt & FORMAT_BOLD)
  const isItalic = node.italic === true || !!(fmt & FORMAT_ITALIC)
  const isCode = node.code === true || !!(fmt & FORMAT_CODE)
  const isUnderline = !!(fmt & FORMAT_UNDERLINE)
  const isStrikethrough = !!(fmt & FORMAT_STRIKETHROUGH)
  const isSubscript = !!(fmt & FORMAT_SUBSCRIPT)
  const isSuperscript = !!(fmt & FORMAT_SUPERSCRIPT)

  if (isCode) el = <code key={`c-${key}`}>{el}</code>
  if (isBold) el = <strong key={`b-${key}`}>{el}</strong>
  if (isItalic) el = <em key={`i-${key}`}>{el}</em>
  if (isUnderline) el = <u key={`u-${key}`}>{el}</u>
  if (isStrikethrough) el = <s key={`s-${key}`}>{el}</s>
  if (isSubscript) el = <sub key={`sb-${key}`}>{el}</sub>
  if (isSuperscript) el = <sup key={`sp-${key}`}>{el}</sup>
  return <React.Fragment key={key}>{el}</React.Fragment>
}

function renderChildren(children: LexicalNode[] | undefined): React.ReactNode {
  if (!children) return null
  return children.map((child, i) => renderNode(child, i))
}

function renderNode(node: LexicalNode, key: number): React.ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'paragraph':
      return <p key={key}>{renderChildren(node.children)}</p>
    case 'heading': {
      const tag = (node.tag as string) || 'h2'
      return React.createElement(tag, { key }, renderChildren(node.children))
    }
    case 'quote':
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>
    case 'list': {
      const Tag: 'ul' | 'ol' = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={key}>{renderChildren(node.children)}</Tag>
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node.children)}</li>
    case 'link': {
      const url = (node.fields as { url?: string } | undefined)?.url || node.url || '#'
      return (
        <a key={key} href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noopener">
          {renderChildren(node.children)}
        </a>
      )
    }
    case 'horizontalrule':
      return <hr key={key} />
    case 'code':
      return (
        <pre key={key}>
          <code>{renderChildren(node.children)}</code>
        </pre>
      )
    case 'code-highlight':
      return <span key={key}>{node.text}</span>
    case 'upload': {
      const relationTo = node.relationTo as string | undefined
      const value = node.value as Record<string, unknown> | undefined
      if (relationTo !== 'media' || !value || typeof value !== 'object') return null
      const media = value as unknown as import('../payload-types').Media
      const url = previewUrl(media)
      if (!url) return null
      const width = media.width || 800
      const height = media.height || 450
      const alt = media.alt || ''
      return (
        <figure key={key} className="richtext-upload">
          <Image
            src={url}
            alt={alt}
            width={width}
            height={height}
            style={{ maxWidth: '100%', height: 'auto' }}
            unoptimized
          />
        </figure>
      )
    }
    default:
      return <React.Fragment key={key}>{renderChildren(node.children)}</React.Fragment>
  }
}

export function RichText({ content }: { content: LexicalRoot | null | undefined }) {
  if (!content?.root?.children?.length) return null
  return <>{renderChildren(content.root.children)}</>
}
