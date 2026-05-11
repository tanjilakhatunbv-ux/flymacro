'use client'

import { useTranslations } from 'next-intl'

type ParsedEmbed =
  | { kind: 'youtube'; src: string }
  | { kind: 'bilibili'; src: string }
  | { kind: 'mp4'; src: string }
  | null

const MP4_RE = /\.(mp4|webm|ogg)(\?.*)?$/i

function parseEmbed(raw: string | null | undefined): ParsedEmbed {
  if (!raw) return null
  const url = raw.trim()
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    if (MP4_RE.test(url)) return { kind: 'mp4', src: url }
    return null
  }

  const host = parsed.hostname.toLowerCase()

  if (host.includes('youtube.com') || host === 'youtu.be') {
    let id: string | null = null
    if (host === 'youtu.be') {
      id = parsed.pathname.replace(/^\//, '')
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.replace('/embed/', '')
    } else {
      id = parsed.searchParams.get('v')
    }
    if (id) {
      return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}` }
    }
  }

  if (host.includes('bilibili.com')) {
    const match = parsed.pathname.match(/\/(BV[a-zA-Z0-9]+|av\d+)/i)
    if (match) {
      const idPart = match[1]
      const isAv = /^av\d+$/i.test(idPart)
      const param = isAv ? `aid=${idPart.slice(2)}` : `bvid=${idPart}`
      return {
        kind: 'bilibili',
        src: `https://player.bilibili.com/player.html?${param}&page=1&high_quality=1&danmaku=0`,
      }
    }
  }

  if (host.includes('player.bilibili.com')) {
    return { kind: 'bilibili', src: url }
  }

  if (MP4_RE.test(parsed.pathname)) {
    return { kind: 'mp4', src: url }
  }

  return null
}

export function VideoEmbed({ url }: { url?: string | null }) {
  const embed = parseEmbed(url)
  const t = useTranslations('video')
  if (!embed) return null

  const title = embed.kind === 'youtube' ? t('youtubeDemo') : embed.kind === 'bilibili' ? t('bilibiliDemo') : t('demoVideo')

  if (embed.kind === 'mp4') {
    return (
      <figure className="video-embed-wrap">
        <div className="video-embed">
          <video controls preload="metadata" src={embed.src} aria-label={title} />
        </div>
        <figcaption className="video-embed-caption">{t('demoVideo')}</figcaption>
      </figure>
    )
  }

  return (
    <figure className="video-embed-wrap">
      <div className="video-embed">
        <iframe
          src={embed.src}
          title={title}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="video-embed-caption">
        {embed.kind === 'youtube' ? `YouTube · ${t('demoVideo')}` : `Bilibili · ${t('demoVideo')}`}
      </figcaption>
    </figure>
  )
}
