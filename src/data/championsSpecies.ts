import type { PokedexEntry } from './types'
import speciesData from './champions-species.json'
import { loadDex } from './loadDex'

export interface ChampionsSpeciesEntry {
  id: string
  name: string
  num: number
  types: string[]
  baseSpecies: string
  forme: string
}

export interface ChampionsSpeciesIndex {
  formatId: string
  formatName: string
  regulation?: string
  source?: string
  exportedAt: string
  count: number
  species: ChampionsSpeciesEntry[]
}

export const championsSpeciesIndex =
  speciesData as ChampionsSpeciesIndex

let byId: Map<string, ChampionsSpeciesEntry> | null = null
let cachedList: ChampionsSpeciesEntry[] | null = null

function isOfficialMega(entry: PokedexEntry): boolean {
  if (!entry?.baseSpecies) return false
  if (typeof entry.num !== 'number' || entry.num < 1) return false
  const forme = String((entry as any).forme ?? '')
  if (!forme.startsWith('Mega')) return false
  // Exclude custom/fanmade suffixes like Mega-Z
  if (forme.includes('Mega-Z')) return false
  return true
}

function toChampionsEntry(id: string, dexEntry: PokedexEntry): ChampionsSpeciesEntry {
  return {
    id,
    name: dexEntry.name,
    num: dexEntry.num,
    types: dexEntry.types ?? [],
    baseSpecies: String((dexEntry as any).baseSpecies ?? dexEntry.name),
    forme: String((dexEntry as any).forme ?? ''),
  }
}

export function getChampionsSpeciesList(): ChampionsSpeciesEntry[] {
  if (cachedList) return cachedList

  const base = championsSpeciesIndex.species
  const dex = loadDex()

  // Mega ufficiali: derivate da pokedex.json, limitate a base species presenti nel roster.
  const allowedBaseSpecies = new Set(base.map((s) => s.baseSpecies))
  const megas: ChampionsSpeciesEntry[] = []

  for (const [id, entry] of Object.entries(dex.pokedex)) {
    if (!isOfficialMega(entry)) continue
    const baseSpecies = String((entry as any).baseSpecies ?? '')
    if (!allowedBaseSpecies.has(baseSpecies)) continue
    megas.push(toChampionsEntry(id, entry))
  }

  megas.sort((a, b) => a.name.localeCompare(b.name))
  cachedList = [...base, ...megas]
  return cachedList
}

export function getChampionsSpeciesById(
  id: string,
): ChampionsSpeciesEntry | undefined {
  if (!byId) {
    byId = new Map(
      getChampionsSpeciesList().map((s) => [s.id, s]),
    )
  }
  return byId.get(id)
}

/** Merge dex entry (abilities, base stats) with champions legality row. */
export function enrichSpecies(
  entry: ChampionsSpeciesEntry,
  pokedex: Record<string, PokedexEntry>,
): ChampionsSpeciesEntry & { dex?: PokedexEntry } {
  return { ...entry, dex: pokedex[entry.id] }
}
