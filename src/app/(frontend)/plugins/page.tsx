import { getCachedPublishedPlugins, getPluginDownloadInfo } from '../../../lib/plugins'
import { PluginVersionCard } from '../../../components/PluginVersionCard'

export const revalidate = 300

export const metadata = {
  title: '插件下载 — FlyMacro',
  description: '魔兽世界插件版本历史与下载，支持文件下载和云盘链接。',
}

export default async function PluginsPage() {
  const plugins = await getCachedPublishedPlugins()

  return (
    <div className="container-page page-list">
      <h1>插件版本历史</h1>
      {plugins.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          暂无已发布的插件版本。
        </p>
      ) : (
        <div className="plugin-list">
          {plugins.map((p) => (
            <PluginVersionCard
              key={p.id}
              version={p.version}
              publishedAt={p.publishedAt}
              changelog={p.changelog}
              downloadInfo={getPluginDownloadInfo(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
