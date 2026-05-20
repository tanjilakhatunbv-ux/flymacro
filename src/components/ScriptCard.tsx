import { Link } from '@/i18n/routing'
import type { Script } from '../payload-types'

interface Props {
  script: Script
  typeLabel: Record<string, string>
  locale: string
}

export function ScriptCard({ script, typeLabel, locale }: Props) {
  const latestVersion = script.latestVersion
    ? (typeof script.latestVersion === 'object' ? script.latestVersion : null)
    : null

  return (
    <Link href={`/scripts/${script.slug}`} className="script-card">
      <div className="script-card-header">
        <span className="script-type">{typeLabel[script.type] ?? script.type}</span>
        {latestVersion && (
          <span className="script-version">v{latestVersion.version}</span>
        )}
      </div>
      <h3 className="script-card-title">{script.name}</h3>
      {script.summary && <p className="script-card-summary">{script.summary}</p>}
      <div className="script-card-footer">
        {script.author && <span className="script-author">{script.author}</span>}
        {script.publishedAt && (
          <span className="script-date">
            {new Date(script.publishedAt).toLocaleDateString(locale)}
          </span>
        )}
      </div>
    </Link>
  )
}
