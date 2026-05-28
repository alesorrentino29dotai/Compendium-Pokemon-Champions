import type { DexBundle } from '../data/types'
import { formatNatureLabel } from './natureLabel'
import { toId } from './toId'

/** Gen 9 / Champions learnset source prefix. */
function isChampionsSource(source: string): boolean {
  return source.startsWith('9')
}

export function getLearnsetMoveNames(
  speciesId: string,
  dex: DexBundle,
): string[] {
  const entry = dex.learnsets[speciesId]
  if (!entry?.learnset) return []

  const names = new Set<string>()

  for (const [moveId, sources] of Object.entries(entry.learnset)) {
    if (!Array.isArray(sources)) continue
    if (!sources.some(isChampionsSource)) continue

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
