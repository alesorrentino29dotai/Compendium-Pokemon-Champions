import { useMemo } from 'react'

import type { ChampionsSpeciesEntry } from '../../data/championsSpecies'
import { loadDex } from '../../data/loadDex'
import { createEmptyPokemonSet } from '../../lib/pokemonSet'
import type { MoveSlotCrits } from '../../lib/smogonCalc'
import type { PokemonSet, StatsRecord } from '../../types/team'
import { PokemonEditor } from '../teambuilder/PokemonEditor'
import { SpeciesSearchSelect } from '../SpeciesSearchSelect'
import { CalcBoosts } from './CalcBoosts'

export interface CalcPokemonPanelProps {
  title: string
  set: PokemonSet | null
  onChange: (set: PokemonSet | null) => void
  /** Functional patch to avoid stale state when editing moves/SP quickly. */
  onPatch: (patch: Partial<PokemonSet>) => void
  teamLoadOptions: { label: string; set: PokemonSet }[]
  boosts: Partial<StatsRecord>
  onBoostsChange: (boosts: Partial<StatsRecord>) => void
  moveCrits: MoveSlotCrits
  onMoveCritChange: (slot: number, isCrit: boolean) => void
  onEvsPatch: (updater: (prev: StatsRecord) => StatsRecord) => void
  onResetMoveCrits: () => void
}

export function CalcPokemonPanel({
  title,
  set,
  onChange,
  onPatch,
  teamLoadOptions,
  boosts,
  onBoostsChange,
  moveCrits,
  onMoveCritChange,
  onEvsPatch,
  onResetMoveCrits,
}: CalcPokemonPanelProps) {
  const dex = loadDex()

  const speciesId = set?.speciesId ?? null

  const teraOptions = useMemo(() => {
    if (!set) return []
    const species = dex.pokedex[set.speciesId]
    const types = species?.types ?? []
    return types
  }, [set, dex])

  const handleSpecies = (entry: ChampionsSpeciesEntry) => {
    const species = dex.pokedex[entry.id]
    if (!species) return
    onChange(createEmptyPokemonSet(entry.id, species))
    onBoostsChange({})
    onResetMoveCrits()
  }

  const loadLabel = useMemo(() => {
    if (teamLoadOptions.length === 0) return 'Nessun Pokémon nel team'
    return 'Carica dal team'
  }, [teamLoadOptions.length])

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-showdown-border bg-showdown-panel p-4 shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-showdown-border pb-2 dark:border-showdown-dark-border">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-showdown-accent">
          {title}
        </h2>
        {teamLoadOptions.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="shrink-0">{loadLabel}</span>
            <select
              value=""
              onChange={(e) => {
                const idx = Number(e.target.value)
                if (Number.isNaN(idx) || idx < 0) return
                const picked = teamLoadOptions[idx]
                if (picked) {
                  onChange(structuredClone(picked.set))
                  onBoostsChange({})
                  onResetMoveCrits()
                }
              }}
              className="max-w-[10rem] rounded border border-showdown-border bg-white px-2 py-1 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              <option value="">—</option>
              {teamLoadOptions.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <SpeciesSearchSelect
        value={speciesId}
        onChange={handleSpecies}
        placeholder="Cerca Pokémon…"
      />

      {set ? (
        <>
          {teraOptions.length > 0 && (
            <label className="text-xs text-gray-500">
              Tera
              <select
                value={set.teraType ?? ''}
                onChange={(e) =>
                  onPatch({
                    teraType: e.target.value || undefined,
                  })
                }
                className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
              >
                <option value="">Nessuno</option>
                {teraOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          )}

          <CalcBoosts boosts={boosts} onChange={onBoostsChange} />

          <PokemonEditor
            set={set}
            onChange={onPatch}
            onClear={() => {
              onChange(null)
              onBoostsChange({})
              onResetMoveCrits()
            }}
            compact
            moveCrits={moveCrits}
            onMoveCritChange={onMoveCritChange}
            onEvsPatch={onEvsPatch}
          />
        </>
      ) : (
        <p className="py-6 text-center text-sm text-gray-500">
          Seleziona un Pokémon per configurare attaccante o difensore.
        </p>
      )}
    </section>
  )
}
