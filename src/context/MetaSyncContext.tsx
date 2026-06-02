import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  initOfflineMeta,
  runMetaSync,
  shouldRunWeeklyCheck,
  type SyncResult,
} from '../lib/dataSync'
import { getSyncState, type SyncState } from '../lib/metaStorage'
import { subscribeVgcData } from '../lib/vgcTeams'

interface MetaSyncContextValue {
  syncState: SyncState | null
  syncing: boolean
  dataRevision: number
  checkForUpdates: (force?: boolean) => Promise<SyncResult | null>
}

const MetaSyncContext = createContext<MetaSyncContextValue | null>(null)

export function MetaSyncProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [dataRevision, setDataRevision] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshState = useCallback(async () => {
    setSyncState(await getSyncState())
  }, [])

  const checkForUpdates = useCallback(async (force = false) => {
    setSyncing(true)
    try {
      const result = await runMetaSync({
        force,
        includePokemonZoneWeb: force,
      })
      await refreshState()
      setDataRevision((n) => n + 1)
      return result
    } finally {
      setSyncing(false)
    }
  }, [refreshState])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await initOfflineMeta()
      if (cancelled) return
      await refreshState()
      const state = await getSyncState()
      if (!cancelled && shouldRunWeeklyCheck(state)) {
        await checkForUpdates(false)
      }
    })()

    const unsub = subscribeVgcData(() => setDataRevision((n) => n + 1))

    return () => {
      cancelled = true
      unsub()
    }
  }, [checkForUpdates, refreshState])

  const value = useMemo(
    () => ({ syncState, syncing, dataRevision, checkForUpdates }),
    [syncState, syncing, dataRevision, checkForUpdates],
  )

  return (
    <MetaSyncContext.Provider value={value}>{children}</MetaSyncContext.Provider>
  )
}

export function useMetaSync(): MetaSyncContextValue {
  const ctx = useContext(MetaSyncContext)
  if (!ctx) {
    throw new Error('useMetaSync must be used within MetaSyncProvider')
  }
  return ctx
}
