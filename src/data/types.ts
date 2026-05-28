/** Minimal Showdown dex shapes used across the app (Step 1). */

export type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface PokedexEntry {
  name: string
  num: number
  types: string[]
  baseStats: BaseStats
  abilities: Record<string, string>
  gender?: string
  isNonstandard?: string
  tier?: string
  /** Other Showdown fields preserved at runtime. */
  [key: string]: unknown
}

export interface MoveEntry {
  name: string
  type: string
  basePower: number
  category?: 'Physical' | 'Special' | 'Status'
  accuracy?: number | true
  pp?: number
  priority?: number
  flags?: Record<string, number | boolean>
  [key: string]: unknown
}

export interface ItemEntry {
  name: string
  spritenum?: number
  [key: string]: unknown
}

export interface AbilityEntry {
  name: string
  rating?: number
  [key: string]: unknown
}

export interface NatureEntry {
  name: string
  plus?: StatName
  minus?: StatName
}

export interface LearnsetEntry {
  learnset?: Record<string, string[]>
  eventOnly?: boolean
  encounters?: unknown[]
  eventData?: unknown[]
  [key: string]: unknown
}

/** Showdown `Types` table (damageTaken: 0 = neutral, 1 = weak, 2 = resist, 3 = immune). */
export interface TypeChartEntry {
  damageTaken: Record<string, number>
  [key: string]: unknown
}

export interface TypeChart {
  [typeId: string]: TypeChartEntry
}

export interface DexMeta {
  fetchedAt: string
  files: string[]
  cdn?: string
  dexPackage?: string
  source?: string
}

export interface DexBundle {
  pokedex: Record<string, PokedexEntry>
  moves: Record<string, MoveEntry>
  items: Record<string, ItemEntry>
  abilities: Record<string, AbilityEntry>
  learnsets: Record<string, LearnsetEntry>
  natures: Record<string, NatureEntry>
  typechart: TypeChart
  meta: DexMeta
}
