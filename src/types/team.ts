import type { StatName } from '../data/types'

/** VGC / Champions battles use level 50. */
export const VGC_LEVEL = 50

/** Pokémon Champions: Stat Points (replaces EVs). */
export const MAX_SP_PER_STAT = 32
export const MAX_SP_TOTAL = 66

/** IVs are always 31 in Pokémon Champions (not used in the stat formula). */
export const CHAMPIONS_FIXED_IV = 31
export const MAX_IV = 31

export type StatsRecord = Record<StatName, number>

export interface PokemonSet {
  /** Showdown species id (e.g. `pikachu`). */
  speciesId: string
  speciesName: string
  nickname?: string
  item: string
  ability: string
  nature: string
  level: number
  /** Stat Points (SP) — stored in `evs` for Showdown export compatibility. */
  evs: StatsRecord
  /** Always 31 in Champions; kept for export / future formats. */
  ivs: StatsRecord
  moves: [string, string, string, string]
  gender?: '' | 'M' | 'F' | 'N'
  shiny?: boolean
  teraType?: string
}

export interface Team {
  id: string
  name: string
  pokemon: (PokemonSet | null)[]
  createdAt: string
  updatedAt: string
}

export interface TeamStoreState {
  teams: Team[]
  activeTeamId: string | null
}

export interface TeamStoreActions {
  createTeam: (name?: string) => string
  deleteTeam: (teamId: string) => void
  renameTeam: (teamId: string, name: string) => void
  setActiveTeam: (teamId: string | null) => void
  duplicateTeam: (teamId: string) => string | null
  setSlot: (teamId: string, slot: number, set: PokemonSet | null) => void
  updatePokemon: (
    teamId: string,
    slot: number,
    patch: Partial<PokemonSet>,
  ) => void
}

export type TeamStore = TeamStoreState & TeamStoreActions
