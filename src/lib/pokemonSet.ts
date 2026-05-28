import type { DexBundle, PokedexEntry } from '../data/types'
import type { PokemonSet } from '../types/team'
import { VGC_LEVEL } from '../types/team'
import { createMaxIvs, createZeroStats } from './stats'
import { toId } from './toId'

export function defaultAbility(species: PokedexEntry): string {
  const abilities = species.abilities
  return abilities['0'] ?? abilities['1'] ?? abilities.H ?? ''
}

export function createEmptyPokemonSet(
  speciesId: string,
  species: PokedexEntry,
): PokemonSet {
  return {
    speciesId,
    speciesName: species.name,
    item: '',
    ability: defaultAbility(species),
    nature: 'serious',
    level: VGC_LEVEL,
    evs: createZeroStats(),
    ivs: createMaxIvs(),
    moves: ['', '', '', ''],
  }
}

export function createPokemonSetFromName(
  name: string,
  dex: DexBundle,
): PokemonSet | null {
  const speciesId = toId(name)
  const species = dex.pokedex[speciesId]
  if (!species?.baseStats) return null
  return createEmptyPokemonSet(speciesId, species)
}

export function clampStatPoints(value: number): number {
  return Math.max(0, Math.min(32, Math.round(value)))
}
