import {
  calculate,
  Field,
  Generations,
  Move,
  Pokemon,
  type Result,
} from '@smogon/calc'
import type { TypeName } from '@smogon/calc/dist/data/interface'

import type { DexBundle } from '../data/types'
import type { PokemonSet, StatsRecord } from '../types/team'
import { getComputedStats } from './teamStats'

const GEN = Generations.get(9)

/** Which side is attacking for field effect mapping. */
export type CalcDirection = 'attackerToDefender' | 'defenderToAttacker'

export interface CalcFieldOptions {
  gameType: 'Singles' | 'Doubles'
  weather: '' | 'Sun' | 'Rain' | 'Sand' | 'Snow' | 'Hail'
  terrain: '' | 'Electric' | 'Grassy' | 'Misty' | 'Psychic'
  isGravity: boolean
  /** Helping Hand on the attacking Pokémon (attacker → defender). */
  helpingHandOnAttacker: boolean
  reflectOnDefender: boolean
  lightScreenOnDefender: boolean
  auroraVeilOnDefender: boolean
  friendGuardOnDefender: boolean
  protectOnDefender: boolean
  /** Helping Hand when defender attacks attacker. */
  helpingHandOnDefender: boolean
  reflectOnAttacker: boolean
  lightScreenOnAttacker: boolean
  auroraVeilOnAttacker: boolean
  friendGuardOnAttacker: boolean
  protectOnAttacker: boolean
}

export const DEFAULT_FIELD: CalcFieldOptions = {
  gameType: 'Doubles',
  weather: '',
  terrain: '',
  isGravity: false,
  helpingHandOnAttacker: false,
  reflectOnDefender: false,
  lightScreenOnDefender: false,
  auroraVeilOnDefender: false,
  friendGuardOnDefender: false,
  protectOnDefender: false,
  helpingHandOnDefender: false,
  reflectOnAttacker: false,
  lightScreenOnAttacker: false,
  auroraVeilOnAttacker: false,
  friendGuardOnAttacker: false,
  protectOnAttacker: false,
}

function natureName(set: PokemonSet, dex: DexBundle): string {
  const entry = dex.natures[set.nature]
  if (!entry?.name) {
    return set.nature.charAt(0).toUpperCase() + set.nature.slice(1)
  }
  return entry.name
}

function applyChampionsStats(pokemon: Pokemon, stats: StatsRecord): void {
  pokemon.rawStats = { ...stats }
  pokemon.stats = { ...stats }
  pokemon.originalCurHP = stats.hp
}

/**
 * calculate() clones attacker/defender and recomputes stats from EVs (Showdown formula).
 * Patch clone() so Champions SP stats survive and damage updates when SP changes.
 */
function attachChampionsStatsForCalc(
  pokemon: Pokemon,
  stats: StatsRecord,
): void {
  applyChampionsStats(pokemon, stats)
  const snapshot: StatsRecord = { ...stats }
  const originalClone = pokemon.clone.bind(pokemon)
  pokemon.clone = function championsClone(this: Pokemon) {
    const cloned = originalClone()
    applyChampionsStats(cloned, snapshot)
    return cloned
  }
}

export interface BuildCalcPokemonOptions {
  boosts?: Partial<StatsRecord>
}

export function buildCalcPokemon(
  set: PokemonSet,
  dex: DexBundle,
  options?: BuildCalcPokemonOptions,
): Pokemon | null {
  const species = dex.pokedex[set.speciesId]
  if (!species) return null

  const stats = getComputedStats(set, dex)
  if (!stats) return null

  const pokemon = new Pokemon(GEN, species.name, {
    level: set.level,
    ability: set.ability || undefined,
    item: set.item || undefined,
    nature: natureName(set, dex),
    ...(set.teraType ? { teraType: set.teraType as TypeName } : {}),
    moves: set.moves.filter(Boolean),
    boosts: options?.boosts,
    status: '',
  })

  attachChampionsStatsForCalc(pokemon, stats)
  return pokemon
}

export function buildCalcField(
  options: CalcFieldOptions,
  direction: CalcDirection,
): Field {
  const screensOnDefender =
    direction === 'attackerToDefender'
      ? {
          isReflect: options.reflectOnDefender,
          isLightScreen: options.lightScreenOnDefender,
          isAuroraVeil: options.auroraVeilOnDefender,
          isFriendGuard: options.friendGuardOnDefender,
          isProtected: options.protectOnDefender,
        }
      : {
          isReflect: options.reflectOnAttacker,
          isLightScreen: options.lightScreenOnAttacker,
          isAuroraVeil: options.auroraVeilOnAttacker,
          isFriendGuard: options.friendGuardOnAttacker,
          isProtected: options.protectOnAttacker,
        }

  const helpingHand =
    direction === 'attackerToDefender'
      ? options.helpingHandOnAttacker
      : options.helpingHandOnDefender

  return new Field({
    gameType: options.gameType,
    weather: options.weather || undefined,
    terrain: options.terrain || undefined,
    isGravity: options.isGravity,
    attackerSide: {
      isHelpingHand: helpingHand,
    },
    defenderSide: screensOnDefender,
  })
}

export interface RunDamageCalcOptions {
  attackerBoosts?: Partial<StatsRecord>
  defenderBoosts?: Partial<StatsRecord>
  direction?: CalcDirection
  isCrit?: boolean
}

/** Crit toggle per move slot (Mossa 1–4). */
export type MoveSlotCrits = [boolean, boolean, boolean, boolean]

export const EMPTY_MOVE_CRITS: MoveSlotCrits = [false, false, false, false]

export interface MoveCalcEntry {
  move: string
  isCrit: boolean
  slot: number
}

export function getMoveCalcEntries(
  set: PokemonSet,
  crits: MoveSlotCrits,
): MoveCalcEntry[] {
  const entries: MoveCalcEntry[] = []
  set.moves.forEach((m, i) => {
    const move = m.trim()
    if (!move) return
    entries.push({ move, isCrit: crits[i] ?? false, slot: i })
  })
  return entries
}

function safeKoText(result: Result): string | undefined {
  try {
    return result.kochance()?.text
  } catch {
    return undefined
  }
}

function safeMoveDescription(result: Result): string {
  try {
    return result.desc()
  } catch {
    return ''
  }
}

function formatSpDescription(
  desc: string,
  attackerSet: PokemonSet,
  defenderSet: PokemonSet,
): string {
  // Replace Showdown EV-like fragments (0 Atk / 0 Def etc) with Champions SP.
  // We keep the original structure but swap values so users see SP invested.
  const atk = attackerSet.evs.atk
  const spa = attackerSet.evs.spa
  const def = defenderSet.evs.def
  const spd = defenderSet.evs.spd
  const hp = defenderSet.evs.hp

  return desc
    .replace(/\b0 Atk\b/g, `${atk} SP Atk`)
    .replace(/\b0 SpA\b/g, `${spa} SP SpA`)
    .replace(/\b0 HP\b/g, `${hp} SP HP`)
    .replace(/\b0 Def\b/g, `${def} SP Def`)
    .replace(/\b0 SpD\b/g, `${spd} SP SpD`)
}

/** Type immunity (0×) — damaging move with 0 damage roll. */
export function isMoveNotEffective(result: Result, move: Move): boolean {
  if (move.category !== 'Physical' && move.category !== 'Special') {
    return false
  }
  const [min, max] = result.range()
  return min === 0 && max === 0
}

export const NOT_EFFECTIVE_LABEL = 'Not effected'

export function runDamageCalc(
  attackerSet: PokemonSet,
  defenderSet: PokemonSet,
  moveName: string,
  dex: DexBundle,
  fieldOptions: CalcFieldOptions = DEFAULT_FIELD,
  calcOptions?: RunDamageCalcOptions,
): Result | null {
  if (!moveName.trim()) return null

  try {
    const attacker = buildCalcPokemon(attackerSet, dex, {
      boosts: calcOptions?.attackerBoosts,
    })
    const defender = buildCalcPokemon(defenderSet, dex, {
      boosts: calcOptions?.defenderBoosts,
    })
    if (!attacker || !defender) return null

    const move = new Move(GEN, moveName, {
      isCrit: calcOptions?.isCrit || undefined,
    })
    const direction = calcOptions?.direction ?? 'attackerToDefender'
    const field = buildCalcField(fieldOptions, direction)

    return calculate(GEN, attacker, defender, move, field)
  } catch {
    return null
  }
}

export function damagePercent(
  result: Result,
  defenderHp: number,
): { min: number; max: number } {
  const [min, max] = result.range()
  if (defenderHp <= 0) return { min: 0, max: 0 }
  return {
    min: Math.round((min / defenderHp) * 1000) / 10,
    max: Math.round((max / defenderHp) * 1000) / 10,
  }
}

export interface MoveDamageResult {
  move: string
  slot: number
  isCrit: boolean
  ok: boolean
  /** Type immunity (0× effectiveness). */
  notEffective: boolean
  min: number
  max: number
  minPct: number
  maxPct: number
  description: string
  koText?: string
}

export function simulateMoveDamage(
  attackerSet: PokemonSet,
  defenderSet: PokemonSet,
  moveEntries: MoveCalcEntry[],
  dex: DexBundle,
  fieldOptions: CalcFieldOptions = DEFAULT_FIELD,
  calcOptions?: RunDamageCalcOptions,
): MoveDamageResult[] {
  const defenderHp = getComputedStats(defenderSet, dex)?.hp ?? 0

  return moveEntries.map(({ move, isCrit, slot }) => {
    try {
      const calcMove = new Move(GEN, move, {
        isCrit: isCrit || undefined,
      })

      const result = runDamageCalc(
        attackerSet,
        defenderSet,
        move,
        dex,
        fieldOptions,
        { ...calcOptions, isCrit },
      )

      if (!result) {
        return {
          move,
          slot,
          isCrit,
          ok: false,
          notEffective: false,
          min: 0,
          max: 0,
          minPct: 0,
          maxPct: 0,
          description: 'Calcolo non disponibile',
        }
      }

      if (isMoveNotEffective(result, calcMove)) {
        return {
          move,
          slot,
          isCrit,
          ok: false,
          notEffective: true,
          min: 0,
          max: 0,
          minPct: 0,
          maxPct: 0,
          description: NOT_EFFECTIVE_LABEL,
        }
      }

      const [min, max] = result.range()
      const pct = damagePercent(result, defenderHp)
      const description = formatSpDescription(
        safeMoveDescription(result),
        attackerSet,
        defenderSet,
      )

      return {
        move,
        slot,
        isCrit,
        ok: true,
        notEffective: false,
        min,
        max,
        minPct: pct.min,
        maxPct: pct.max,
        description: description || 'Calcolo non disponibile',
        koText: safeKoText(result),
      }
    } catch {
      return {
        move,
        slot,
        isCrit,
        ok: false,
        notEffective: false,
        min: 0,
        max: 0,
        minPct: 0,
        maxPct: 0,
        description: 'Calcolo non disponibile',
      }
    }
  })
}

/** Stable key so damage results recompute when any relevant input changes. */
export function calcSetKey(
  set: PokemonSet | null,
  boosts: Partial<StatsRecord>,
): string {
  if (!set) return ''
  return JSON.stringify({
    speciesId: set.speciesId,
    ability: set.ability,
    item: set.item,
    nature: set.nature,
    level: set.level,
    evs: set.evs,
    moves: set.moves,
    teraType: set.teraType,
    boosts,
  })
}

