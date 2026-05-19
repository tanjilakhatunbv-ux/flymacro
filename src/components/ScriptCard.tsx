import { Link } from '@/i18n/routing'
import type { Script } from '../payload-types'

interface Props {
  script: Script
}

export function ScriptCard({ script }: Props) {
  const latestVersion = script.latestVersion
    ? (typeof script.latestVersion === 'object' ? script.latestVersion : null)
    : null

  const typeLabel: Record<string, string> = {
    macro: '宏命令',
    addon: '插件',
    tool: '工具',
    other: '其他',
  }

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
            {new Date(script.publishedAt).toLocaleDateString('zh-CN')}
          </span>
        )}
      </div>
    </Link>
  )
}
