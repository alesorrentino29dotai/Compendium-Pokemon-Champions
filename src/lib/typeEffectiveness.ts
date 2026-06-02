import type { DexBundle } from '../data/types'

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

function typeMultiplier(
  attackType: string,
  defendTypes: string[],
  chart: DexBundle['typechart'],
): number {
  let mult = 1
  const atk = chart[attackType.toLowerCase()]
  if (!atk) return 1

  for (const defType of defendTypes) {
    const def = defType.toLowerCase()
    if (atk.damageTaken[def] === 1) mult *= 2
    else if (atk.damageTaken[def] === 2) mult *= 0.5
    else if (atk.damageTaken[def] === 3) mult = 0
  }
  return mult
}

export function getTypeEffectiveness(
  types: string[],
  chart: DexBundle['typechart'],
): TypeEffectiveness {
  const allTypes = Object.keys(chart).filter((t) => t && t !== '???')
  const weak4x: string[] = []
  const weak2x: string[] = []
  const resist2x: string[] = []
  const resist4x: string[] = []
  const immune: string[] = []

  for (const atk of allTypes) {
    const mult = typeMultiplier(atk, types, chart)
    const label = atk.charAt(0).toUpperCase() + atk.slice(1)
    if (mult === 0) immune.push(label)
    else if (mult >= 4) weak4x.push(label)
    else if (mult === 2) weak2x.push(label)
    else if (mult <= 0.25) resist4x.push(label)
    else if (mult === 0.5) resist2x.push(label)
  }

  const sort = (a: string, b: string) => a.localeCompare(b)
  return {
    weak4x: weak4x.sort(sort),
    weak2x: weak2x.sort(sort),
    resist2x: resist2x.sort(sort),
    resist4x: resist4x.sort(sort),
    immune: immune.sort(sort),
  }
}
