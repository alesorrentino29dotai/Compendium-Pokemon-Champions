import { useMemo, useState } from 'react'

import { loadDex } from '../../data/loadDex'
import {
  buildReferenceSpeedGrid,
  filterReferenceGrid,
  REFERENCE_SP_SPE,
  sortReferenceGrid,
  type NatureSpeedCase,
  type NatureSpeedCell,
  type ReferenceSortKey,
} from '../../lib/speedTiers'
import type { SpeedModifiers } from '../../lib/stats'
import { PokemonSprite } from '../PokemonSprite'
import { SpeedModifiersBar } from './SpeedModifiersBar'
import { SpSpeControl } from './SpSpeControl'

const NATURE_FILTERS: { id: NatureSpeedCase | 'all'; label: string }[] = [
  { id: 'all', label: 'All natures' },
  { id: 'positive', label: '+Spe' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'negative', label: '−Spe' },
]

const SORT_OPTIONS: { id: ReferenceSortKey; label: string }[] = [
  { id: 'positive', label: 'Final Speed (+Spe)' },
  { id: 'neutral', label: 'Final Speed (neutral)' },
  { id: 'negative', label: 'Final Speed (−Spe)' },
  { id: 'name', label: 'Name A–Z' },
]

function SpeCell({ cell, emphasize }: { cell: NatureSpeedCell; emphasize?: boolean }) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 transition-colors ${
        emphasize
          ? 'bg-showdown-accent/15 ring-1 ring-showdown-accent/30'
          : 'bg-white/60 dark:bg-showdown-dark-bg/60'
      }`}
    >
      <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">
        {cell.natureLabel}
      </p>
      <p className="font-mono text-sm font-semibold text-showdown-accent">
        {cell.finalSpe}
      </p>
      <p className="font-mono text-[10px] text-gray-400">base {cell.baseSpe}</p>
    </div>
  )
}

export interface ReferenceSpeedGridProps {
  mods: SpeedModifiers
  onModsChange: (patch: Partial<SpeedModifiers>) => void
}

export function ReferenceSpeedGrid({
  mods,
  onModsChange,
}: ReferenceSpeedGridProps) {
  const dex = loadDex()
  const [query, setQuery] = useState('')
  const [natureFilter, setNatureFilter] = useState<NatureSpeedCase | 'all'>('all')
  const [sortBy, setSortBy] = useState<ReferenceSortKey>('positive')
  const [spSpe, setSpSpe] = useState(REFERENCE_SP_SPE)

  const rows = useMemo(() => {
    const grid = buildReferenceSpeedGrid(dex, mods, spSpe)
    const filtered = filterReferenceGrid(grid, query, natureFilter)
    return sortReferenceGrid(filtered, sortBy)
  }, [dex, mods, spSpe, query, natureFilter, sortBy])

  const emphasizeColumn: NatureSpeedCase | null =
    natureFilter === 'all' ? null : natureFilter

  return (
    <section className="rounded-lg border border-showdown-border bg-showdown-panel shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
      <div className="border-b border-showdown-border p-3 sm:p-4 dark:border-showdown-dark-border">
        <div>
          <h3 className="text-sm font-semibold text-showdown-accent">
            Reference speed database
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {rows.length > 0 ? `${rows.length} species` : ''}
          </p>
        </div>

        <div className="mt-4 rounded-md border border-showdown-border/60 bg-showdown-hover/30 p-3 dark:border-showdown-dark-border/60 dark:bg-showdown-dark-panel/40">
          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            Modifiers
          </p>
          <SpeedModifiersBar mods={mods} onChange={onModsChange} compact />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-gray-500 sm:col-span-2 lg:col-span-1">
            Search Pokémon
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or id…"
              className="mt-1 w-full rounded-md border border-showdown-border bg-white px-3 py-2 text-sm shadow-sm focus:border-showdown-accent focus:outline-none focus:ring-1 focus:ring-showdown-accent dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            />
          </label>

          <label className="text-xs text-gray-500">
            Nature filter
            <select
              value={natureFilter}
              onChange={(e) =>
                setNatureFilter(e.target.value as NatureSpeedCase | 'all')
              }
              className="mt-1 w-full rounded-md border border-showdown-border bg-white px-3 py-2 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              {NATURE_FILTERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-gray-500">
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReferenceSortKey)}
              className="mt-1 w-full rounded-md border border-showdown-border bg-white px-3 py-2 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">
          No Pokémon match the filters.
        </p>
      ) : (
        <div className="scroll-touch max-h-[min(70vh,32rem)] max-w-full">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-showdown-panel shadow-sm dark:bg-showdown-dark-panel">
              <tr className="border-b border-showdown-border text-left text-xs uppercase tracking-wide text-gray-500 dark:border-showdown-dark-border">
                <th className="px-3 py-2.5 font-semibold">Pokémon</th>
                <th className="px-2 py-2.5 font-semibold text-center">
                  <span className="block">SP</span>
                  <div className="mt-1.5 flex justify-center normal-case">
                    <SpSpeControl value={spSpe} onChange={setSpSpe} />
                  </div>
                </th>
                <th
                  className={`px-2 py-2.5 font-semibold ${
                    emphasizeColumn === 'positive'
                      ? 'text-showdown-accent'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  +Spe
                </th>
                <th
                  className={`px-2 py-2.5 font-semibold ${
                    emphasizeColumn === 'neutral'
                      ? 'text-showdown-accent'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Neutro
                </th>
                <th
                  className={`px-2 py-2.5 font-semibold ${
                    emphasizeColumn === 'negative'
                      ? 'text-showdown-accent'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  −Spe
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const species = dex.pokedex[row.speciesId]
                return (
                  <tr
                    key={row.speciesId}
                    className={`border-b border-showdown-border/40 transition-colors hover:bg-showdown-hover/80 dark:border-showdown-dark-border/40 dark:hover:bg-showdown-dark-panel/80 ${
                      index % 2 === 0
                        ? 'bg-white/40 dark:bg-showdown-dark-bg/20'
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <PokemonSprite
                          speciesId={row.speciesId}
                          speciesName={row.label}
                          nationalNum={species?.num ?? 0}
                          size={36}
                          className="shrink-0"
                        />
                        <span className="font-medium leading-tight">
                          {row.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-gray-500">
                      {row.spSpe}
                    </td>
                    <td className="px-2 py-2">
                      <SpeCell
                        cell={row.positive}
                        emphasize={emphasizeColumn === 'positive'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <SpeCell
                        cell={row.neutral}
                        emphasize={emphasizeColumn === 'neutral'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <SpeCell
                        cell={row.negative}
                        emphasize={emphasizeColumn === 'negative'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
