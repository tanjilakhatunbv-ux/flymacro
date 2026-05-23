import { Link } from '@/i18n/routing'
import type { Script, ScriptFile } from '../payload-types'

interface Props {
  script: Script
  typeLabel: Record<string, string>
  locale: string
  downloadLabel: string
}

export function ScriptCard({ script, typeLabel, locale, downloadLabel }: Props) {
  const latestVersion = script.latestVersion
    ? (typeof script.latestVersion === 'object' ? script.latestVersion : null)
    : null
  const file = latestVersion && typeof latestVersion.scriptFile === 'object'
    ? latestVersion.scriptFile as ScriptFile
    : null
  const filename = file?.filename ?? null
  const updatedAt = latestVersion?.publishedAt ?? latestVersion?.updatedAt ?? script.publishedAt

  function formatFileSize(bytes?: number | null): string {
    if (bytes == null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <article className="script-card">
      <div className="script-card-header">
        <span className="script-type">{typeLabel[script.type] ?? script.type}</span>
        {latestVersion && (
          <span className="script-version">v{latestVersion.version}</span>
        )}
      </div>
      <h3 className="script-card-title">
        <Link href={`/scripts/${script.slug}`}>{script.name}</Link>
      </h3>
      {script.summary && <p className="script-card-summary">{script.summary}</p>}
      <div className="script-card-footer">
        {script.author && <span className="script-author">{script.author}</span>}
        {updatedAt && (
          <span className="script-date">
            {new Date(updatedAt).toLocaleDateString(locale)}
          </span>
        )}
      </div>
      {file?.url ? (
        <a href={file.url} download={filename ?? true} className="btn btn-primary script-card-download">
          {downloadLabel}
          {file.filesize ? ` (${formatFileSize(file.filesize)})` : ''}
        </a>
      ) : null}
    </article>
  )
}
