import type { DexBundle } from '../data/types'
import type { PokemonSet, StatsRecord } from '../types/team'
import { calcChampionsStats } from './stats'

export function getComputedStats(
  set: PokemonSet,
  dex: DexBundle,
): StatsRecord | null {
  const species = dex.pokedex[set.speciesId]
  if (!species?.baseStats) return null

  const natureId = set.nature.toLowerCase().replace(/[^a-z]/g, '')
  const nature = dex.natures[set.nature] ?? dex.natures[natureId]

  return calcChampionsStats({
    base: species.baseStats,
    sp: set.evs,
    nature,
  })
}
