'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { PluginDownloadInfo } from '../lib/plugins'

interface Props {
  version: string
  publishedAt?: string
  changelog?: string
  downloadInfo: PluginDownloadInfo
  showHistoryLink?: boolean
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function PluginDownloadSection({ version, publishedAt, changelog, downloadInfo, showHistoryLink = true }: Props) {
  const t = useTranslations('plugins')
  return (
    <div className="plugin-download-section">
      <div className="plugin-download-meta">
        <span className="plugin-version">{t('latestVersion', { version })}</span>
        {publishedAt && (
          <span className="plugin-date">· {formatDate(publishedAt)}</span>
        )}
      </div>

      {changelog && (
        <p className="plugin-changelog">{changelog}</p>
      )}

      <div className="plugin-download-actions">
        {downloadInfo?.mode === 'file' && (
          <a
            href={downloadInfo.url}
            className="btn btn-primary"
            download={downloadInfo.fileName}
          >
            {t('downloadPlugin')}
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

        {showHistoryLink && (
          <Link href="/plugins" className="btn">
            {t('viewHistory')}
          </Link>
        )}
      </div>
    </div>
  )
}
