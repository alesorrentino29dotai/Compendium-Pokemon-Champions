import bundled from '../data/pokemonZoneMeta.json'
import {
  getCachedPokemonZoneMeta,
  type PokemonZoneMetaBundle,
  type PokemonZoneSpeciesMeta,
} from './metaStorage'

let activeMeta: PokemonZoneMetaBundle = bundled as PokemonZoneMetaBundle

export function getPokemonZoneMetaBundle(): PokemonZoneMetaBundle {
  return activeMeta
}

export function setActivePokemonZoneMeta(bundle: PokemonZoneMetaBundle): void {
  activeMeta = bundle
}

export function getBundledPokemonZoneMeta(): PokemonZoneMetaBundle {
  return bundled as PokemonZoneMetaBundle
}

export async function loadPokemonZoneMetaFromCache(): Promise<void> {
  const cached = await getCachedPokemonZoneMeta()
  if (!cached) return
  const bundledAt = getBundledPokemonZoneMeta().exportedAt
  if (new Date(cached.exportedAt).getTime() > new Date(bundledAt).getTime()) {
    activeMeta = cached
  }
}

export function getPokemonZoneSpeciesMeta(
  speciesId: string,
): PokemonZoneSpeciesMeta | null {
  return activeMeta.species[speciesId] ?? null
}
