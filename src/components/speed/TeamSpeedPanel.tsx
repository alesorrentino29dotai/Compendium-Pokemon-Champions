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
import { SpeedModifiersBar } from './SpeedModifiersBar'
import { SpSpeControl } from './SpSpeControl'

export interface TeamSpeedPanelProps {
  teamName: string
  pokemon: (PokemonSet | null)[]
  mods: SpeedModifiers
  onModsChange: (patch: Partial<SpeedModifiers>) => void
  /** Local-only edits (no Teambuilder sync). */
  onOverrideChange: (
    slot: number,
    patch: { nature?: PokemonSet['nature']; spe?: number },
  ) => void
}

export function TeamSpeedPanel({
  teamName,
  pokemon,
  mods,
  onModsChange,
  onOverrideChange,
}: TeamSpeedPanelProps) {
  const dex = loadDex()

  const rows = useMemo(
    () => buildTeamSpeedRows(pokemon, dex, mods),
    [pokemon, dex, mods],
  )

  if (rows.length === 0) {
    return (
      <section className="rounded-lg border border-showdown-border bg-showdown-panel p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        <h3 className="mb-2 text-sm font-semibold text-showdown-accent">
          Team: {teamName}
        </h3>
        <p className="text-sm text-gray-500">
          Nessun Pokémon nel team attivo. Aggiungili dal Teambuilder.
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
          Ordinato per Spe finale (più veloce in alto) · modifiche sincronizzate
          con il Teambuilder
        </p>
        <div className="mt-3 border-t border-showdown-border/60 pt-3 dark:border-showdown-dark-border/60">
          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            Modificatori di campo
          </p>
          <SpeedModifiersBar mods={mods} onChange={onModsChange} compact />
        </div>
      </div>
      <div className="scroll-touch max-w-full">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-showdown-border bg-showdown-hover/50 text-left text-xs text-gray-500 dark:border-showdown-dark-border dark:bg-showdown-dark-panel/50">
              <th className="px-3 py-2 font-medium">Pokémon</th>
              <th className="px-2 py-2 font-medium text-center">SP</th>
              <th className="px-2 py-2 font-medium">Natura</th>
              <th className="px-2 py-2 font-medium">Spe base</th>
              <th className="px-3 py-2 font-medium">Spe finale</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TeamSpeedRow
                key={row.key}
                row={row}
                dex={dex}
                set={pokemon[row.teamSlot]!}
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
  onNatureChange,
  onSpChange,
}: {
  row: SpeedTierRow
  dex: ReturnType<typeof loadDex>
  set: PokemonSet
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
      <td className="px-2 py-2.5 font-mono text-gray-500">{row.baseSpe}</td>
      <td className="px-3 py-2.5 font-mono text-lg font-semibold text-showdown-accent">
        {row.finalSpe}
      </td>
    </tr>
  )
}
