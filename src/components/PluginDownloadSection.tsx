'use client'

import Link from 'next/link'
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

export function PluginDownloadSection({ version, publishedAt, changelog, downloadInfo }: Props) {
  return (
    <div className="plugin-download-section">
      <div className="plugin-download-meta">
        <span className="plugin-version">最新版本 {version}</span>
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
            下载插件
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
              前往云盘下载
            </a>
            {downloadInfo.password && (
              <span className="plugin-password">
                提取码：{downloadInfo.password}
              </span>
            )}
          </div>
        )}

        {!downloadInfo && (
          <span className="plugin-unavailable">暂无下载资源</span>
        )}

        <Link href="/plugins" className="btn">
          查看历史版本
        </Link>
      </div>
    </div>
  )
}
