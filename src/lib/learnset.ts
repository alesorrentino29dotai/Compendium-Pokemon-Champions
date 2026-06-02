import type { DexBundle } from '../data/types'
import { formatNatureLabel } from './natureLabel'
import { toId } from './toId'

export function getLearnsetMoveNames(
  speciesId: string,
  dex: DexBundle,
): string[] {
  const species = dex.pokedex[speciesId]
  const baseSpeciesName = (species?.baseSpecies as string | undefined) || species?.name
  const baseId = baseSpeciesName ? toId(baseSpeciesName) : ''

  const selfLearnset = dex.learnsets[speciesId]?.learnset
  const baseLearnset = baseId ? dex.learnsets[baseId]?.learnset : undefined

  // Formes: use union(self, base) so Rotom appliances keep exclusive moves
  // while inheriting the full base species learnset.
  const mergedLearnset: Record<string, string[]> | undefined =
    selfLearnset || baseLearnset
      ? { ...(baseLearnset ?? {}), ...(selfLearnset ?? {}) }
      : undefined

  if (!mergedLearnset) return []

  const names = new Set<string>()

  for (const [moveId, sources] of Object.entries(mergedLearnset)) {
    if (!Array.isArray(sources)) continue
    if (sources.length === 0) continue

    const move = dex.moves[moveId]
    if (move?.name) names.add(move.name)
  }

  return [...names].sort((a, b) => a.localeCompare(b))
}

export function getAbilityOptions(
  speciesId: string,
  dex: DexBundle,
): string[] {
  const species = dex.pokedex[speciesId]
  if (!species?.abilities) return []

  const out = new Set<string>()
  for (const ability of Object.values(species.abilities)) {
    if (typeof ability === 'string' && ability) out.add(ability)
  }
  return [...out]
}

export interface NatureOption {
  id: string
  name: string
  label: string
}

export function getNatureOptions(dex: DexBundle): NatureOption[] {
  return Object.entries(dex.natures)
    .map(([id, n]) => ({
      id,
      name: n.name,
      label: formatNatureLabel(n),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getItemOptions(dex: DexBundle): string[] {
  return Object.values(dex.items)
    .map((i) => i.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

export function findMoveIdByName(name: string, dex: DexBundle): string {
  const id = toId(name)
  if (dex.moves[id]?.name) return id
  const found = Object.values(dex.moves).find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  )
  return found ? toId(found.name) : id
}
