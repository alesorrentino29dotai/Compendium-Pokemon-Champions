import type { PokedexEntry } from './types'
import speciesData from './champions-species.json'

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

export function getChampionsSpeciesList(): ChampionsSpeciesEntry[] {
  return championsSpeciesIndex.species
}

export function getChampionsSpeciesById(
  id: string,
): ChampionsSpeciesEntry | undefined {
  if (!byId) {
    byId = new Map(
      championsSpeciesIndex.species.map((s) => [s.id, s]),
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
