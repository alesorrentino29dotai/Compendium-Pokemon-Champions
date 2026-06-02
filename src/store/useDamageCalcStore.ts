import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_FIELD, EMPTY_MOVE_CRITS, type CalcFieldOptions, type MoveSlotCrits } from '../lib/smogonCalc'
import type { PokemonSet, StatsRecord } from '../types/team'

export interface DamageCalcState {
  attacker: PokemonSet | null
  defender: PokemonSet | null
  attackerBoosts: Partial<StatsRecord>
  defenderBoosts: Partial<StatsRecord>
  field: CalcFieldOptions
  attackerCrits: MoveSlotCrits
  defenderCrits: MoveSlotCrits

  setAttacker: (set: PokemonSet | null) => void
  setDefender: (set: PokemonSet | null) => void
  patchAttacker: (patch: Partial<PokemonSet>) => void
  patchDefender: (patch: Partial<PokemonSet>) => void
  patchAttackerEvs: (updater: (prev: StatsRecord) => StatsRecord) => void
  patchDefenderEvs: (updater: (prev: StatsRecord) => StatsRecord) => void
  setAttackerBoosts: (boosts: Partial<StatsRecord>) => void
  setDefenderBoosts: (boosts: Partial<StatsRecord>) => void
  patchField: (patch: Partial<CalcFieldOptions>) => void
  setAttackerCrits: (crits: MoveSlotCrits) => void
  setDefenderCrits: (crits: MoveSlotCrits) => void
  setAttackerMoveCrit: (slot: number, isCrit: boolean) => void
  setDefenderMoveCrit: (slot: number, isCrit: boolean) => void
  reset: () => void
}

const STORAGE_KEY = 'compendium-damage-calc'
const STORAGE_VERSION = 1

export const useDamageCalcStore = create<DamageCalcState>()(
  persist(
    (set, get) => ({
      attacker: null,
      defender: null,
      attackerBoosts: {},
      defenderBoosts: {},
      field: DEFAULT_FIELD,
      attackerCrits: EMPTY_MOVE_CRITS,
      defenderCrits: EMPTY_MOVE_CRITS,

      setAttacker: (attacker) => set({ attacker }),
      setDefender: (defender) => set({ defender }),

      patchAttacker: (patch) =>
        set((s) => (s.attacker ? { attacker: { ...s.attacker, ...patch } } : {})),
      patchDefender: (patch) =>
        set((s) => (s.defender ? { defender: { ...s.defender, ...patch } } : {})),

      patchAttackerEvs: (updater) =>
        set((s) =>
          s.attacker
            ? { attacker: { ...s.attacker, evs: updater({ ...s.attacker.evs }) } }
            : {},
        ),
      patchDefenderEvs: (updater) =>
        set((s) =>
          s.defender
            ? { defender: { ...s.defender, evs: updater({ ...s.defender.evs }) } }
            : {},
        ),

      setAttackerBoosts: (attackerBoosts) => set({ attackerBoosts }),
      setDefenderBoosts: (defenderBoosts) => set({ defenderBoosts }),

      patchField: (patch) => set((s) => ({ field: { ...s.field, ...patch } })),

      setAttackerCrits: (attackerCrits) => set({ attackerCrits }),
      setDefenderCrits: (defenderCrits) => set({ defenderCrits }),

      setAttackerMoveCrit: (slot, isCrit) => {
        const prev = get().attackerCrits
        const next = [...prev] as MoveSlotCrits
        next[slot] = isCrit
        set({ attackerCrits: next })
      },
      setDefenderMoveCrit: (slot, isCrit) => {
        const prev = get().defenderCrits
        const next = [...prev] as MoveSlotCrits
        next[slot] = isCrit
        set({ defenderCrits: next })
      },

      reset: () =>
        set({
          attacker: null,
          defender: null,
          attackerBoosts: {},
          defenderBoosts: {},
          field: DEFAULT_FIELD,
          attackerCrits: EMPTY_MOVE_CRITS,
          defenderCrits: EMPTY_MOVE_CRITS,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
    },
  ),
)

