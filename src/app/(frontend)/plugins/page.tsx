import {
  getCachedLatestPublishedPlugin,
  getCachedPublishedPlugins,
  getPluginDownloadInfo,
} from '../../../lib/plugins'
import { PluginDownloadSection } from '../../../components/PluginDownloadSection'
import { PluginVersionCard } from '../../../components/PluginVersionCard'

export const revalidate = 300

export const metadata = {
  title: '插件下载 — FlyMacro',
  description: '魔兽世界插件版本历史与下载，支持文件下载和云盘链接。',
}

export default async function PluginsPage() {
  const [latestPlugin, allPlugins] = await Promise.all([
    getCachedLatestPublishedPlugin(),
    getCachedPublishedPlugins(),
  ])

  const olderPlugins = latestPlugin
    ? allPlugins.filter((p) => p.id !== latestPlugin.id)
    : allPlugins

  return (
    <div className="container-page page-list">
      {latestPlugin ? (
        <>
          <section className="plugin-latest-section">
            <h1>插件下载</h1>
            <PluginDownloadSection
              version={latestPlugin.version}
              publishedAt={latestPlugin.publishedAt}
              changelog={latestPlugin.changelog}
              downloadInfo={getPluginDownloadInfo(latestPlugin)}
              showHistoryLink={false}
            />
          </section>

          {olderPlugins.length > 0 && (
            <>
              <h2 className="plugin-older-title">历史版本</h2>
              <div className="plugin-list">
                {olderPlugins.map((p) => (
                  <PluginVersionCard
                    key={p.id}
                    version={p.version}
                    publishedAt={p.publishedAt}
                    changelog={p.changelog}
                    downloadInfo={getPluginDownloadInfo(p)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
          暂无已发布的插件版本。
        </p>
      )}
    </div>
  )
}
