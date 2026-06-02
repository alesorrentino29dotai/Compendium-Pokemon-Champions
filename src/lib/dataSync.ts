import {
  getCachedPokemonZoneMeta,
  getCachedVgcTeams,
  getSyncState,
  setCachedPokemonZoneMeta,
  setCachedVgcTeams,
  setSyncState,
  type PokemonZoneMetaBundle,
  type SyncState,
} from './metaStorage'
import {
  getBundledPokemonZoneMeta,
  setActivePokemonZoneMeta,
} from './pokemonZoneData'
import { mergePokemonZoneMeta, syncPokemonZoneFromWeb } from './pokemonZoneSync'
import {
  getBundledVgcTeams,
  getVgcTeamsBundle,
  notifyVgcDataChanged,
  setActiveVgcBundle,
  type VgcTeamsBundle,
} from './vgcTeams'
import {
  buildVgcBundleFromCsv,
  mergeVgcBundles,
  VGC_SHEET_CSV_URL,
} from './vgcTeamsBuild'

export const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000

export interface LiveDataManifest {
  version: string
  exportedAt: string
  vgcTeamsUrl: string
  pokemonZoneMetaUrl: string
}

function liveDataBase(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}data/live/`
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function shouldRunWeeklyCheck(state: SyncState): boolean {
  if (!state.lastCheckAt) return true
  const elapsed = Date.now() - new Date(state.lastCheckAt).getTime()
  return elapsed >= WEEKLY_MS
}

function isNewerIso(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a) return false
  if (!b) return true
  return new Date(a).getTime() > new Date(b).getTime()
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'no-store' })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function syncVgcFromSheet(): Promise<VgcTeamsBundle | null> {
  const csv = await fetchText(VGC_SHEET_CSV_URL)
  if (!csv) return null

  const fresh = buildVgcBundleFromCsv(csv)
  if (!fresh) return null

  const cached = await getCachedVgcTeams()
  const bundled = getVgcTeamsBundle()
  return mergeVgcBundles(fresh, cached ?? bundled)
}

async function syncFromLiveManifest(): Promise<{
  vgc: VgcTeamsBundle | null
  pokemonZone: PokemonZoneMetaBundle | null
  manifest: LiveDataManifest | null
}> {
  const manifest = await fetchJson<LiveDataManifest>(`${liveDataBase()}manifest.json`)
  if (!manifest) return { vgc: null, pokemonZone: null, manifest: null }

  const state = await getSyncState()
  if (
    state.liveManifestVersion === manifest.version &&
    !shouldRunWeeklyCheck(state)
  ) {
    return { vgc: null, pokemonZone: null, manifest }
  }

  let vgc: VgcTeamsBundle | null = null
  let pokemonZone: PokemonZoneMetaBundle | null = null

  if (manifest.vgcTeamsUrl) {
    vgc = await fetchJson<VgcTeamsBundle>(
      manifest.vgcTeamsUrl.startsWith('http')
        ? manifest.vgcTeamsUrl
        : `${liveDataBase()}${manifest.vgcTeamsUrl}`,
    )
  }

  if (manifest.pokemonZoneMetaUrl) {
    pokemonZone = await fetchJson<PokemonZoneMetaBundle>(
      manifest.pokemonZoneMetaUrl.startsWith('http')
        ? manifest.pokemonZoneMetaUrl
        : `${liveDataBase()}${manifest.pokemonZoneMetaUrl}`,
    )
  }

  return { vgc, pokemonZone, manifest }
}

export interface SyncResult {
  state: SyncState
  updatedVgc: boolean
  updatedPokemonZone: boolean
}

export async function runMetaSync(options?: {
  force?: boolean
  includePokemonZoneWeb?: boolean
}): Promise<SyncResult> {
  const force = options?.force ?? false
  let state = await getSyncState()

  if (!force && !shouldRunWeeklyCheck(state)) {
    return { state, updatedVgc: false, updatedPokemonZone: false }
  }

  if (!isOnline()) {
    state = await setSyncState({
      lastCheckAt: new Date().toISOString(),
      lastStatus: 'partial',
      lastMessage: 'Offline — using bundled data',
    })
    return { state, updatedVgc: false, updatedPokemonZone: false }
  }

  state = await setSyncState({
    lastCheckAt: new Date().toISOString(),
    lastStatus: 'checking',
    lastMessage: 'Checking for updates…',
  })

  let updatedVgc = false
  let updatedPokemonZone = false
  const messages: string[] = []

  const live = await syncFromLiveManifest()
  if (live.manifest) {
    const currentVgc = getVgcTeamsBundle()
    if (live.vgc && isNewerIso(live.vgc.exportedAt, currentVgc.exportedAt)) {
      await setCachedVgcTeams(live.vgc)
      setActiveVgcBundle(live.vgc)
      updatedVgc = true
      messages.push('VGC data (app bundle)')
    }
    if (live.pokemonZone) {
      const cached = (await getCachedPokemonZoneMeta()) ?? getBundledPokemonZoneMeta()
      if (isNewerIso(live.pokemonZone.exportedAt, cached.exportedAt)) {
        await setCachedPokemonZoneMeta(live.pokemonZone)
        setActivePokemonZoneMeta(live.pokemonZone)
        updatedPokemonZone = true
        messages.push('Pokémon Zone meta (app bundle)')
      }
    }
    if (live.manifest.version) {
      await setSyncState({ liveManifestVersion: live.manifest.version })
    }
  }

  const sheetBundle = await syncVgcFromSheet()
  if (sheetBundle) {
    const current = getVgcTeamsBundle()
    if (
      sheetBundle.teamCount !== current.teamCount ||
      isNewerIso(sheetBundle.exportedAt, current.exportedAt)
    ) {
      const merged = mergeVgcBundles(sheetBundle, await getCachedVgcTeams())
      await setCachedVgcTeams(merged)
      setActiveVgcBundle(merged)
      updatedVgc = true
      messages.push('VGC spreadsheet')
    }
  }

  if (options?.includePokemonZoneWeb ?? false) {
    const pz = await syncPokemonZoneFromWeb({ maxSpecies: 20 })
    if (pz) {
      const base =
        (await getCachedPokemonZoneMeta()) ?? getBundledPokemonZoneMeta()
      const merged = mergePokemonZoneMeta(base, pz)
      await setCachedPokemonZoneMeta(merged)
      setActivePokemonZoneMeta(merged)
      updatedPokemonZone = true
      messages.push('Pokémon Zone (browser)')
    }
  }

  const status =
    updatedVgc || updatedPokemonZone
      ? 'ok'
      : messages.length
        ? 'ok'
        : 'partial'

  state = await setSyncState({
    lastSuccessAt:
      updatedVgc || updatedPokemonZone
        ? new Date().toISOString()
        : state.lastSuccessAt,
    vgcExportedAt: updatedVgc
      ? getVgcTeamsBundle().exportedAt
      : state.vgcExportedAt,
    pokemonZoneExportedAt: updatedPokemonZone
      ? new Date().toISOString()
      : state.pokemonZoneExportedAt,
    lastStatus: status,
    lastMessage:
      updatedVgc || updatedPokemonZone
        ? `Updated: ${messages.join(', ')}`
        : 'Already up to date (offline-ready data in use)',
  })

  notifyVgcDataChanged()

  return { state, updatedVgc, updatedPokemonZone }
}

export async function initOfflineMeta(): Promise<void> {
  const cached = await getCachedVgcTeams()
  const bundled = getBundledVgcTeams()
  if (cached && isNewerIso(cached.exportedAt, bundled.exportedAt)) {
    setActiveVgcBundle(cached)
  }

  const { loadPokemonZoneMetaFromCache } = await import('./pokemonZoneData')
  await loadPokemonZoneMetaFromCache()

  notifyVgcDataChanged()
}
