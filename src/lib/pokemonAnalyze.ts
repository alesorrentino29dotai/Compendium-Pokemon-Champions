import { loadDex } from '../data/loadDex'
import type { DexBundle, PokedexEntry } from '../data/types'
import type { StatsRecord } from '../types/team'
import { createZeroStats, calcChampionsStats } from './stats'
import { getTypeEffectiveness, type TypeEffectiveness } from './typeEffectiveness'
import { getPokemonZoneSpeciesMeta } from './pokemonZoneData'
import {
  getSpeciesName,
  getVgcSpeciesStats,
  pokemonZoneUrl,
  type VgcBuildRow,
  type VgcItemRow,
  type VgcTeammateRow,
} from './vgcTeams'

export interface PokemonAnalyzeData {
  speciesId: string
  speciesName: string
  types: string[]
  baseStats: PokedexEntry['baseStats']
  computedStats: ReturnType<typeof calcChampionsStats>
  abilities: string[]
  effectiveness: TypeEffectiveness
  vgcAppearances: number
  teammates: (VgcTeammateRow & { speciesName: string })[]
  topItems: VgcItemRow[]
  metaBuilds: VgcBuildRow[]
  pokemonZoneUrl: string
}

export function buildPokemonAnalyze(
  speciesId: string,
  sampleSet?: { nature: string; evs: StatsRecord },
): PokemonAnalyzeData | null {
  const dex = loadDex()
  const species = dex.pokedex[speciesId]
  if (!species?.baseStats) return null

  const natureId = sampleSet?.nature?.toLowerCase().replace(/[^a-z]/g, '') ?? 'serious'
  const nature =
    dex.natures[sampleSet?.nature ?? ''] ??
    dex.natures[natureId] ??
    dex.natures.serious

  const evs = sampleSet?.evs ?? createZeroStats()

  const vgc = getVgcSpeciesStats(speciesId)
  const pz = getPokemonZoneSpeciesMeta(speciesId)
  const abilities = Object.values(species.abilities).filter(Boolean)

  const teammatesSource = pz?.teammates?.length
    ? pz.teammates
    : (vgc?.teammates ?? [])
  const itemsSource = pz?.items?.length ? pz.items : (vgc?.items ?? [])
  const buildsSource: VgcBuildRow[] = pz?.builds?.length
    ? pz.builds
    : (vgc?.builds ?? [])

  return {
    speciesId,
    speciesName: species.name,
    types: species.types,
    baseStats: species.baseStats,
    computedStats: calcChampionsStats({
      base: species.baseStats,
      sp: evs,
      nature,
    }),
    abilities,
    effectiveness: getTypeEffectiveness(species.types, dex.typechart),
    vgcAppearances: pz?.appearances ?? vgc?.appearances ?? 0,
    teammates: teammatesSource.map((t) => ({
      ...t,
      speciesName: getSpeciesName(t.speciesId),
    })),
    topItems: itemsSource,
    metaBuilds: buildsSource,
    pokemonZoneUrl: pokemonZoneUrl(speciesId),
  }
}

export function formatStat(n: number): string {
  return String(n)
}

export function statLabels(_dex: DexBundle): Record<string, string> {
  return {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe',
  }
}
