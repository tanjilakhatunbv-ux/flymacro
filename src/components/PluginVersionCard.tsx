'use client'

import { useTranslations } from 'next-intl'
import type { PluginDownloadInfo } from '../lib/plugins'

interface Props {
  version: string
  publishedAt?: string
  changelog?: string
  downloadInfo: PluginDownloadInfo
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PluginVersionCard({ version, publishedAt, changelog, downloadInfo }: Props) {
  const t = useTranslations('plugins')
  return (
    <article className="plugin-version-card">
      <div className="plugin-version-header">
        <h3 className="plugin-version-title">{version}</h3>
        {publishedAt && (
          <time className="plugin-version-date" dateTime={publishedAt}>
            {formatDate(publishedAt)}
          </time>
        )}
      </div>

      {changelog && <p className="plugin-version-changelog">{changelog}</p>}

      <div className="plugin-version-actions">
        {downloadInfo?.mode === 'file' && (
          <a
            href={downloadInfo.url}
            className="btn btn-primary"
            download={downloadInfo.fileName}
          >
            {t('downloadPlugin')}
            {downloadInfo.fileSize && (
              <span className="file-size">({formatFileSize(downloadInfo.fileSize)})</span>
            )}
          </a>
        )}

        {downloadInfo?.mode === 'link' && (
          <div className="plugin-link-group">
            <a
              href={downloadInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              {t('cloudDownload')}
            </a>
            {downloadInfo.password && (
              <span className="plugin-password">
                {t('password', { password: downloadInfo.password })}
              </span>
            )}
          </div>
        )}

        {!downloadInfo && (
          <span className="plugin-unavailable">{t('noDownload')}</span>
        )}
      </div>
    </article>
  )
}
