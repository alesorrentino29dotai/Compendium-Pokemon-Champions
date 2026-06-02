import type { VgcTeamsBundle } from './vgcTeams'

const DB_NAME = 'compendium-offline'
const DB_VERSION = 1
const STORE = 'meta'

export interface PokemonZoneMetaBundle {
  exportedAt: string
  source: string
  species: Record<string, PokemonZoneSpeciesMeta>
}

export interface PokemonZoneSpeciesMeta {
  appearances?: number
  teammates?: { speciesId: string; count: number; pct: number }[]
  items?: { item: string; count: number; pct: number }[]
  builds?: {
    ability: string
    item: string
    moves: string[]
    count: number
    pct: number
  }[]
}

export interface SyncState {
  lastCheckAt: string | null
  lastSuccessAt: string | null
  vgcExportedAt: string | null
  pokemonZoneExportedAt: string | null
  liveManifestVersion: string | null
  lastStatus: 'idle' | 'checking' | 'ok' | 'partial' | 'error'
  lastMessage?: string
}

const DEFAULT_SYNC: SyncState = {
  lastCheckAt: null,
  lastSuccessAt: null,
  vgcExportedAt: null,
  pokemonZoneExportedAt: null,
  liveManifestVersion: null,
  lastStatus: 'idle',
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
    tx.oncomplete = () => db.close()
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

const KEYS = {
  vgc: 'vgcTeams',
  pokemonZone: 'pokemonZoneMeta',
  sync: 'syncState',
} as const

export async function getCachedVgcTeams(): Promise<VgcTeamsBundle | null> {
  return idbGet<VgcTeamsBundle>(KEYS.vgc)
}

export async function setCachedVgcTeams(bundle: VgcTeamsBundle): Promise<void> {
  await idbSet(KEYS.vgc, bundle)
}

export async function getCachedPokemonZoneMeta(): Promise<PokemonZoneMetaBundle | null> {
  return idbGet<PokemonZoneMetaBundle>(KEYS.pokemonZone)
}

export async function setCachedPokemonZoneMeta(
  bundle: PokemonZoneMetaBundle,
): Promise<void> {
  await idbSet(KEYS.pokemonZone, bundle)
}

export async function getSyncState(): Promise<SyncState> {
  const state = await idbGet<SyncState>(KEYS.sync)
  return state ?? { ...DEFAULT_SYNC }
}

export async function setSyncState(patch: Partial<SyncState>): Promise<SyncState> {
  const prev = await getSyncState()
  const next = { ...prev, ...patch }
  await idbSet(KEYS.sync, next)
  return next
}
