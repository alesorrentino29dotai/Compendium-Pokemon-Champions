import { useMetaSync } from '../hooks/useMetaSync'

function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function DataSyncStatus() {
  const { syncState, syncing, checkForUpdates } = useMetaSync()

  if (!syncState) return null

  const title = syncState.lastMessage ?? 'Offline-ready; checks weekly when online'

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-[12rem] truncate text-[10px] text-gray-500 sm:inline"
        title={title}
      >
        Data: {formatRelative(syncState.lastSuccessAt)}
      </span>
      <button
        type="button"
        disabled={syncing}
        onClick={() => void checkForUpdates(true)}
        className="shrink-0 rounded border border-showdown-border px-2 py-1 text-[10px] hover:bg-showdown-hover disabled:opacity-50 dark:border-showdown-dark-border"
        title="Check for updates from VGCPastes sheet and bundled live data (works offline afterward)"
      >
        {syncing ? 'Updating…' : 'Check updates'}
      </button>
    </div>
  )
}
