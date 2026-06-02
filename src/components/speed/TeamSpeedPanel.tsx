import { useMemo } from 'react'

import { loadDex } from '../../data/loadDex'
import {
  buildTeamSpeedRows,
  natureIdForCase,
  type NatureSpeedCase,
  type SpeedTierRow,
} from '../../lib/speedTiers'
import type { SpeedModifiers } from '../../lib/stats'
import type { PokemonSet } from '../../types/team'
import { PokemonSprite } from '../PokemonSprite'
import { NatureCasePicker } from './NatureCasePicker'
import { SpSpeControl } from './SpSpeControl'
import { CheckboxField } from '../ui/CheckboxField'

export interface TeamSpeedPanelProps {
  teamName: string
  pokemon: (PokemonSet | null)[]
  modsBySlot: Record<number, SpeedModifiers | undefined>
  onModsChange: (slot: number, patch: Partial<SpeedModifiers>) => void
  /** Local-only edits (no Teambuilder sync). */
  onOverrideChange: (
    slot: number,
    patch: { nature?: PokemonSet['nature']; spe?: number },
  ) => void
}

export function TeamSpeedPanel({
  teamName,
  pokemon,
  modsBySlot,
  onModsChange,
  onOverrideChange,
}: TeamSpeedPanelProps) {
  const dex = loadDex()

  const rows = useMemo(
    () => buildTeamSpeedRows(pokemon, dex, modsBySlot),
    [pokemon, dex, modsBySlot],
  )

  if (rows.length === 0) {
    return (
      <section className="rounded-lg border border-showdown-border bg-showdown-panel p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        <h3 className="mb-2 text-sm font-semibold text-showdown-accent">
          Team: {teamName}
        </h3>
        <p className="text-sm text-gray-500">
          No Pokémon in the active team. Add them in Teambuilder.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-showdown-border bg-showdown-panel shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
      <div className="border-b border-showdown-border px-3 py-3 sm:px-4 dark:border-showdown-dark-border">
        <h3 className="text-sm font-semibold text-showdown-accent">
          Team: {teamName}
        </h3>
        <p className="text-xs text-gray-500">
          Sorted by final Speed (fastest first).
        </p>
      </div>
      <div className="scroll-touch max-w-full">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-showdown-border bg-showdown-hover/50 text-left text-xs text-gray-500 dark:border-showdown-dark-border dark:bg-showdown-dark-panel/50">
              <th className="px-3 py-2 font-medium">Pokémon</th>
              <th className="px-2 py-2 font-medium text-center">SP</th>
              <th className="px-2 py-2 font-medium">Nature</th>
              <th className="px-2 py-2 font-medium">Mods</th>
              <th className="px-2 py-2 font-medium">Base</th>
              <th className="px-3 py-2 font-medium">Final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TeamSpeedRow
                key={row.key}
                row={row}
                dex={dex}
                set={pokemon[row.teamSlot]!}
                mods={modsBySlot[row.teamSlot] ?? {}}
                onModsChange={(patch) => onModsChange(row.teamSlot, patch)}
                onNatureChange={(caseType) =>
                  onOverrideChange(row.teamSlot, {
                    nature: natureIdForCase(caseType, dex),
                  })
                }
                onSpChange={(spe) => onOverrideChange(row.teamSlot, { spe })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TeamSpeedRow({
  row,
  dex,
  set,
  mods,
  onModsChange,
  onNatureChange,
  onSpChange,
}: {
  row: SpeedTierRow
  dex: ReturnType<typeof loadDex>
  set: PokemonSet
  mods: SpeedModifiers
  onModsChange: (patch: Partial<SpeedModifiers>) => void
  onNatureChange: (caseType: NatureSpeedCase) => void
  onSpChange: (spe: number) => void
}) {
  const species = dex.pokedex[row.speciesId]

  return (
    <tr className="border-b border-showdown-border/50 bg-showdown-accent/5 transition-colors dark:border-showdown-dark-border/50 dark:bg-showdown-accent/10">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <PokemonSprite
            speciesId={row.speciesId}
            speciesName={row.label}
            nationalNum={species?.num ?? 0}
            size={36}
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium leading-tight">{row.label}</p>
            <p className="text-[10px] text-showdown-accent">
              slot {row.teamSlot + 1}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <SpSpeControl value={set.evs.spe} onChange={onSpChange} />
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-col gap-1">
          <NatureCasePicker
            value={row.natureCase}
            onChange={onNatureChange}
          />
          <p className="max-w-[8rem] truncate text-[10px] text-gray-500">
            {row.natureLabel}
          </p>
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs">
          <CheckboxField
            label="Scarf"
            checked={!!mods.choiceScarf}
            onChange={(v) => onModsChange({ choiceScarf: v })}
          />
          <CheckboxField
            label="TW"
            checked={!!mods.tailwind}
            onChange={(v) => onModsChange({ tailwind: v })}
          />
          <CheckboxField
            label="Para"
            checked={!!mods.paralysis}
            onChange={(v) => onModsChange({ paralysis: v })}
          />
          <label className="flex items-center gap-1 text-[10px] text-gray-500">
            Stage
            <select
              value={mods.statStages ?? 0}
              onChange={(e) => onModsChange({ statStages: Number(e.target.value) })}
              className="rounded border border-showdown-border bg-white px-1 py-1 text-xs dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              {[-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6].map((s) => (
                <option key={s} value={s}>
                  {s === 0 ? '0' : s > 0 ? `+${s}` : `${s}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </td>
      <td className="px-2 py-2.5 font-mono text-gray-500">{row.baseSpe}</td>
      <td className="px-3 py-2.5 font-mono text-lg font-semibold text-showdown-accent">
        {row.finalSpe}
      </td>
    </tr>
  )
}
