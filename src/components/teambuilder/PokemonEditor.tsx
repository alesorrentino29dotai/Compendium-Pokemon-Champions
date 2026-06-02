import { useMemo } from 'react'

import { loadDex } from '../../data/loadDex'
import {
  getAbilityOptions,
  getItemOptions,
  getLearnsetMoveNames,
  getNatureOptions,
} from '../../lib/learnset'
import type { MoveSlotCrits } from '../../lib/smogonCalc'
import type { PokemonSet, StatsRecord } from '../../types/team'
import { PokemonSprite } from '../PokemonSprite'
import { SearchableSelect } from './SearchableSelect'
import { StatBar } from './StatBar'

export interface PokemonEditorProps {
  set: PokemonSet
  onChange: (patch: Partial<PokemonSet>) => void
  onClear: () => void
  onAnalyze?: () => void
  /** Per-slot critical hit toggles (damage calc). */
  moveCrits?: MoveSlotCrits
  onMoveCritChange?: (slot: number, isCrit: boolean) => void
  /** Functional SP updates for live damage recalc. */
  onEvsPatch?: (updater: (prev: StatsRecord) => StatsRecord) => void
}

export function PokemonEditor({
  set,
  onChange,
  onClear,
  onAnalyze,
  moveCrits,
  onMoveCritChange,
  onEvsPatch,
}: PokemonEditorProps) {
  const dex = loadDex()
  const species = dex.pokedex[set.speciesId]

  const base = species?.baseStats ?? {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  }

  const natureEntry = useMemo(() => {
    const natureId = set.nature.toLowerCase().replace(/[^a-z]/g, '')
    return dex.natures[set.nature] ?? dex.natures[natureId]
  }, [set.nature, dex])

  const abilities = useMemo(
    () => getAbilityOptions(set.speciesId, dex),
    [set.speciesId, dex],
  )

  const moves = useMemo(
    () => getLearnsetMoveNames(set.speciesId, dex),
    [set.speciesId, dex],
  )

  const natures = useMemo(() => getNatureOptions(dex), [dex])
  const items = useMemo(() => getItemOptions(dex), [dex])

  const updateMove = (index: number, move: string) => {
    const next = [...set.moves] as PokemonSet['moves']
    next[index] = move
    onChange({ moves: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4 border-b border-showdown-border pb-4 dark:border-showdown-dark-border">
        <PokemonSprite
          speciesId={set.speciesId}
          speciesName={set.speciesName}
          nationalNum={species?.num ?? 0}
          size={80}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-showdown-accent">
              {set.speciesName}
            </h3>
            {onAnalyze && (
              <button
                type="button"
                onClick={onAnalyze}
                className="rounded border border-showdown-border px-2 py-0.5 text-xs hover:bg-showdown-hover dark:border-showdown-dark-border"
              >
                Analyze
              </button>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-gray-500">
          Ability
          <select
            value={set.ability}
            onChange={(e) => onChange({ ability: e.target.value })}
            className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
          >
            {abilities.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-gray-500">
          Nature
          <select
            value={set.nature}
            onChange={(e) => onChange({ nature: e.target.value })}
            className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
          >
            {natures.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-gray-500">
          Item
          <SearchableSelect
            value={set.item}
            options={items}
            onChange={(item) => onChange({ item })}
            placeholder="Search item…"
            className="mt-0.5"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
          Moves
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {set.moves.map((move, i) => (
            <div key={i} className="space-y-1">
              <label className="text-xs text-gray-500">
                Move {i + 1}
                <SearchableSelect
                  value={move}
                  options={moves}
                  onChange={(m) => updateMove(i, m)}
                  placeholder="Search move…"
                  className="mt-0.5"
                />
              </label>
              {moveCrits && onMoveCritChange && (
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={moveCrits[i] ?? false}
                    onChange={(e) => onMoveCritChange(i, e.target.checked)}
                    className="accent-showdown-accent"
                  />
                  Critical
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <StatBar
        evs={set.evs}
        base={base}
        nature={natureEntry}
        onEvsChange={onEvsPatch ? undefined : (evs) => onChange({ evs })}
        onEvsPatch={onEvsPatch}
      />
    </div>
  )
}
