import type { NatureEntry, StatName } from '../data/types'
import type { StatsRecord } from '../types/team'
import {
  MAX_SP_PER_STAT,
  MAX_SP_TOTAL,
} from '../types/team'

const STATS: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

/**
 * Cartridge-style truncation used by Pokémon Champions (@pkmn/mods/champions).
 * @see https://github.com/pkmn/ps/blob/main/mods/champions/scripts.ts statModify
 */
export function championsTrunc(num: number, bits = 0): number {
  const unsigned = num >>> 0
  if (bits) return unsigned % 2 ** bits
  return unsigned
}

/**
 * Pokémon Champions stat formula at level 50.
 * SP (Stat Points) replace EVs: +1 per point invested in that stat.
 * IVs are not part of the calculation (always 31 in-game).
 *
 * HP  = base + SP + 75
 * Other = base + SP + 20, then ×1.1 / ×0.9 nature (16-bit trunc)
 */
export function calcChampionsStat(
  stat: StatName,
  base: number,
  sp: number,
  nature?: NatureEntry,
): number {
  if (stat === 'hp') {
    return base + sp + 75
  }

  let value = base + sp + 20

  if (nature?.plus === stat) {
    value = championsTrunc(championsTrunc(value * 110, 16) / 100)
  } else if (nature?.minus === stat) {
    value = championsTrunc(championsTrunc(value * 90, 16) / 100)
  }

  return value
}

export interface CalcChampionsStatsInput {
  base: StatsRecord
  /** Stat Points per stat (stored as `evs` on PokemonSet). */
  sp: StatsRecord
  nature?: NatureEntry
}

export function calcChampionsStats({
  base,
  sp,
  nature,
}: CalcChampionsStatsInput): StatsRecord {
  const result = {} as StatsRecord
  for (const stat of STATS) {
    result[stat] = calcChampionsStat(stat, base[stat], sp[stat], nature)
  }
  return result
}

export function createZeroStats(): StatsRecord {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
}

export function createMaxIvs(): StatsRecord {
  return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
}

export function totalStatPoints(sp: StatsRecord): number {
  return STATS.reduce((sum, s) => sum + sp[s], 0)
}

export function isValidStatPointSpread(sp: StatsRecord): boolean {
  if (totalStatPoints(sp) > MAX_SP_TOTAL) return false
  return STATS.every((s) => sp[s] >= 0 && sp[s] <= MAX_SP_PER_STAT)
}

/** Optional battle multipliers for speed (Speed Tiers). */
export interface SpeedModifiers {
  choiceScarf?: boolean
  tailwind?: boolean
  paralysis?: boolean
  statStages?: number
}

export function applySpeedModifiers(
  speed: number,
  mods: SpeedModifiers = {},
): number {
  let value = speed

  if (mods.statStages) {
    const stage = Math.max(-6, Math.min(6, mods.statStages))
    const mult = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)
    value = Math.floor(value * mult)
  }

  if (mods.paralysis) value = Math.floor(value / 2)
  if (mods.choiceScarf) value = Math.floor(value * 1.5)
  if (mods.tailwind) value = Math.floor(value * 2)

  return value
}
