type ParsedEmbed =
  | { kind: 'youtube'; src: string; title: string }
  | { kind: 'bilibili'; src: string; title: string }
  | { kind: 'mp4'; src: string; title: string }
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
    if (MP4_RE.test(url)) return { kind: 'mp4', src: url, title: '演示视频' }
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
      return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}`, title: 'YouTube 演示视频' }
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
        title: 'B站 演示视频',
      }
    }
  }

  if (host.includes('player.bilibili.com')) {
    return { kind: 'bilibili', src: url, title: 'B站 演示视频' }
  }

  if (MP4_RE.test(parsed.pathname)) {
    return { kind: 'mp4', src: url, title: '演示视频' }
  }

  return null
}

export function VideoEmbed({ url }: { url?: string | null }) {
  const embed = parseEmbed(url)
  if (!embed) return null

  if (embed.kind === 'mp4') {
    return (
      <figure className="video-embed-wrap">
        <div className="video-embed">
          <video controls preload="metadata" src={embed.src} aria-label={embed.title} />
        </div>
        <figcaption className="video-embed-caption">演示视频</figcaption>
      </figure>
    )
  }

  return (
    <figure className="video-embed-wrap">
      <div className="video-embed">
        <iframe
          src={embed.src}
          title={embed.title}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="video-embed-caption">
        {embed.kind === 'youtube' ? 'YouTube · 演示视频' : 'Bilibili · 演示视频'}
      </figcaption>
    </figure>
  )
}
