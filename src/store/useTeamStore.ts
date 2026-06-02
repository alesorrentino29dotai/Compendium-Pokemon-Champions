import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { loadDex } from '../data/loadDex'
import { createPokemonSetFromName } from '../lib/pokemonSet'
import type { PokemonSet, Team, TeamStore } from '../types/team'

const STORAGE_KEY = 'compendium-teams'
const STORAGE_VERSION = 1

function emptySlots(): (PokemonSet | null)[] {
  return [null, null, null, null, null, null]
}

function nowIso(): string {
  return new Date().toISOString()
}

function newTeam(name: string): Team {
  const t = nowIso()
  return {
    id: crypto.randomUUID(),
    name,
    pokemon: emptySlots(),
    createdAt: t,
    updatedAt: t,
  }
}

function touchTeam(team: Team): Team {
  return { ...team, updatedAt: nowIso() }
}

function assertSlot(slot: number) {
  if (slot < 0 || slot > 5) {
    throw new RangeError(`Slot must be 0–5, got ${slot}`)
  }
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teams: [],
      activeTeamId: null,

      createTeam: (name) => {
        const team = newTeam(
          name?.trim() || `Team ${get().teams.length + 1}`,
        )
        set((state) => ({
          teams: [...state.teams, team],
          activeTeamId: team.id,
        }))
        return team.id
      },

      deleteTeam: (teamId) => {
        set((state) => {
          const teams = state.teams.filter((t) => t.id !== teamId)
          const activeTeamId =
            state.activeTeamId === teamId
              ? (teams[0]?.id ?? null)
              : state.activeTeamId
          return { teams, activeTeamId }
        })
      },

      renameTeam: (teamId, name) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId ? touchTeam({ ...t, name: name.trim() }) : t,
          ),
        }))
      },

      setActiveTeam: (teamId) => {
        set({ activeTeamId: teamId })
      },

      duplicateTeam: (teamId) => {
        const source = get().teams.find((t) => t.id === teamId)
        if (!source) return null
        const copy = newTeam(`${source.name} (copy)`)
        copy.pokemon = source.pokemon.map((p) =>
          p ? { ...p, moves: [...p.moves] as PokemonSet['moves'] } : null,
        )
        set((state) => ({
          teams: [...state.teams, copy],
          activeTeamId: copy.id,
        }))
        return copy.id
      },

      setSlot: (teamId, slot, pokemon) => {
        assertSlot(slot)
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t
            const next = [...t.pokemon] as (PokemonSet | null)[]
            next[slot] = pokemon
            return touchTeam({ ...t, pokemon: next })
          }),
        }))
      },

      updatePokemon: (teamId, slot, patch) => {
        assertSlot(slot)
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t
            const current = t.pokemon[slot]
            if (!current) return t
            const next = [...t.pokemon] as (PokemonSet | null)[]
            next[slot] = { ...current, ...patch }
            return touchTeam({ ...t, pokemon: next })
          }),
        }))
      },

      setAllSlots: (teamId, pokemon) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? touchTeam({
                  ...t,
                  pokemon: pokemon.map((p) =>
                    p ? { ...p, moves: [...p.moves] as PokemonSet['moves'] } : null,
                  ) as (PokemonSet | null)[],
                })
              : t,
          ),
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
    },
  ),
)

/** Demo helper: add a species to the first empty slot of the active team. */
export function addSpeciesToActiveTeam(speciesName: string): boolean {
  const dex = loadDex()
  const set = createPokemonSetFromName(speciesName, dex)
  if (!set) return false

  const store = useTeamStore.getState()
  let teamId = store.activeTeamId
  if (!teamId) {
    teamId = store.createTeam()
  }

  const team = store.teams.find((t) => t.id === teamId)
  if (!team) return false

  const slot = team.pokemon.findIndex((p) => p === null)
  if (slot === -1) return false

  store.setSlot(teamId, slot, set)
  return true
}

export function getActiveTeam(): Team | undefined {
  const { teams, activeTeamId } = useTeamStore.getState()
  return teams.find((t) => t.id === activeTeamId)
}
