import type { DexBundle } from '../data/types'
import { formatTypeName } from './typeColors'

export interface TypeEffectiveness {
  /** Incoming types that deal 4× (after dual-type stacking). */
  weak4x: string[]
  /** Incoming types that deal 2×. */
  weak2x: string[]
  /** Incoming types that deal 0.5×. */
  resist2x: string[]
  /** Incoming types that deal 0.25×. */
  resist4x: string[]
  /** Immunities (0×). */
  immune: string[]
}

const SKIP_TYPES = new Set(['', '???', 'stellar'])

/**
 * Multiplier for an incoming attack type vs the defender's types.
 * Uses each defending type's `damageTaken` map (Showdown typechart).
 */
function typeMultiplier(
  attackTypeId: string,
  defendTypeIds: string[],
  chart: DexBundle['typechart'],
): number {
  let mult = 1
  const attackKey = formatTypeName(attackTypeId)

  for (const defId of defendTypeIds) {
    const entry = chart[defId.toLowerCase()]
    if (!entry?.damageTaken) continue

    const mod = entry.damageTaken[attackKey]
    if (mod === 1) mult *= 2
    else if (mod === 2) mult *= 0.5
    else if (mod === 3) mult = 0
  }

  return mult
}

function sortTypes(types: string[]): string[] {
  return [...types].sort((a, b) => a.localeCompare(b))
}

export function getTypeEffectiveness(
  types: string[],
  chart: DexBundle['typechart'],
): TypeEffectiveness {
  const defendTypeIds = types
    .map((t) => formatTypeName(t))
    .filter((t) => t && !SKIP_TYPES.has(t.toLowerCase()))
    .map((t) => t.toLowerCase())

  const weak4x: string[] = []
  const weak2x: string[] = []
  const resist2x: string[] = []
  const resist4x: string[] = []
  const immune: string[] = []

  if (defendTypeIds.length === 0) {
    return {
      weak4x: [],
      weak2x: [],
      resist2x: [],
      resist4x: [],
      immune: [],
    }
  }

  const allAttackTypes = Object.keys(chart).filter(
    (t) => !SKIP_TYPES.has(t.toLowerCase()),
  )

  for (const atkId of allAttackTypes) {
    const mult = typeMultiplier(atkId, defendTypeIds, chart)
    const label = formatTypeName(atkId)

    if (mult === 0) immune.push(label)
    else if (mult >= 4) weak4x.push(label)
    else if (mult === 2) weak2x.push(label)
    else if (mult <= 0.25) resist4x.push(label)
    else if (mult === 0.5) resist2x.push(label)
  }

  return {
    weak4x: sortTypes(weak4x),
    weak2x: sortTypes(weak2x),
    resist2x: sortTypes(resist2x),
    resist4x: sortTypes(resist4x),
    immune: sortTypes(immune),
  }
}
