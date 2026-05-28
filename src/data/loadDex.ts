import type { DexBundle } from './types'

import abilitiesJson from './raw/abilities.json'
import learnsetsJson from './raw/learnsets.json'
import itemsJson from './raw/items.json'
import metaJson from './raw/_meta.json'
import movesJson from './raw/moves.json'
import naturesJson from './raw/natures.json'
import pokedexJson from './raw/pokedex.json'
import typechartJson from './raw/typechart.json'

let cachedDex: DexBundle | null = null

/**
 * Returns the full local Showdown dex (bundled at build time for offline PWA).
 */
export function loadDex(): DexBundle {
  if (cachedDex) return cachedDex

  cachedDex = {
    pokedex: pokedexJson as unknown as DexBundle['pokedex'],
    moves: movesJson as unknown as DexBundle['moves'],
    items: itemsJson as unknown as DexBundle['items'],
    abilities: abilitiesJson as unknown as DexBundle['abilities'],
    learnsets: learnsetsJson as unknown as DexBundle['learnsets'],
    natures: naturesJson as unknown as DexBundle['natures'],
    typechart: typechartJson as unknown as DexBundle['typechart'],
    meta: metaJson as unknown as DexBundle['meta'],
  }

  return cachedDex
}

/** Species visible in teambuilder search (excludes nonstandard / unreleased). */
export function getSelectableSpecies(dex: DexBundle): DexBundle['pokedex'] {
  const out: DexBundle['pokedex'] = {}

  for (const [id, species] of Object.entries(dex.pokedex)) {
    if (species.isNonstandard && species.isNonstandard !== 'Unobtainable') {
      continue
    }
    out[id] = species
  }

  return out
}
