import { useMemo } from 'react'

import { buildPokemonAnalyze } from '../../lib/pokemonAnalyze'
import type { PokemonSet } from '../../types/team'
import { PokemonSprite } from '../PokemonSprite'
import { loadDex } from '../../data/loadDex'

export interface PokemonAnalyzeModalProps {
  set: PokemonSet
  open: boolean
  onClose: () => void
}

function UsageBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 truncate" title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-showdown-accent"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-gray-500">{pct}%</span>
    </div>
  )
}

function TypePills({ types, variant }: { types: string[]; variant: 'weak' | 'resist' | 'immune' }) {
  if (!types.length) return <span className="text-xs text-gray-400">—</span>
  const colors =
    variant === 'weak'
      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
      : variant === 'immune'
        ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'

  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => (
        <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors}`}>
          {t}
        </span>
      ))}
    </div>
  )
}

export function PokemonAnalyzeModal({ set, open, onClose }: PokemonAnalyzeModalProps) {
  const dex = loadDex()
  const data = useMemo(
    () => buildPokemonAnalyze(set.speciesId, { nature: set.nature, evs: set.evs }),
    [set.speciesId, set.nature, set.evs],
  )

  if (!open || !data) return null

  const species = dex.pokedex[set.speciesId]
  const statOrder = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const
  const statNames: Record<string, string> = {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analyze-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-showdown-border bg-showdown-panel shadow-xl sm:rounded-xl dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-showdown-border px-4 py-3 dark:border-showdown-dark-border">
          <PokemonSprite
            speciesId={set.speciesId}
            speciesName={data.speciesName}
            nationalNum={species?.num ?? 0}
            size={64}
          />
          <div className="min-w-0 flex-1">
            <h2 id="analyze-title" className="text-lg font-semibold">
              {data.speciesName}
            </h2>
            <p className="text-sm text-gray-500">
              {data.types.join(' / ')} · VGC sheet appearances:{' '}
              <strong>{data.vgcAppearances}</strong>
            </p>
            <a
              href={data.pokemonZoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-showdown-accent hover:underline"
            >
              Full meta on Pokémon Zone ↗
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-showdown-hover"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Base stats (level 50, current SP)
            </h3>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {statOrder.map((stat) => {
                const base = data.baseStats[stat]
                const computed = data.computedStats[stat]
                const max = 200
                return (
                  <div key={stat} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-medium">{statNames[stat]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-showdown-accent/80"
                        style={{ width: `${Math.min(100, (computed / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-gray-600 dark:text-gray-300">
                      {base} → {computed}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Abilities
            </h3>
            <ul className="list-inside list-disc text-sm">
              {data.abilities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Type chart (defensive)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-medium text-red-600">4× weak</p>
                <TypePills types={data.effectiveness.weak4x} variant="weak" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-medium text-red-500">2× weak</p>
                <TypePills types={data.effectiveness.weak2x} variant="weak" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-medium text-green-600">2× resist</p>
                <TypePills types={data.effectiveness.resist2x} variant="resist" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-medium text-green-700">4× resist</p>
                <TypePills types={data.effectiveness.resist4x} variant="resist" />
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1 text-[10px] font-medium text-gray-600">Immune</p>
                <TypePills types={data.effectiveness.immune} variant="immune" />
              </div>
            </div>
          </section>

          {data.metaBuilds.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Meta builds (VGCPastes)
              </h3>
              <ul className="space-y-3">
                {data.metaBuilds.slice(0, 5).map((b, i) => (
                  <li
                    key={i}
                    className="rounded border border-showdown-border p-2 text-xs dark:border-showdown-dark-border"
                  >
                    <div className="mb-1 flex justify-between gap-2">
                      <span className="font-medium">{b.pct}% usage</span>
                      <span className="text-gray-500">{b.count} teams</span>
                    </div>
                    <p>
                      <span className="text-gray-500">Ability:</span> {b.ability || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">Item:</span> {b.item || '—'}
                    </p>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {b.moves.filter(Boolean).join(' · ') || '—'}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.teammates.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Common teammates
              </h3>
              <div className="space-y-1.5">
                {data.teammates.slice(0, 10).map((t) => (
                  <UsageBar
                    key={t.speciesId}
                    label={t.speciesName}
                    pct={t.pct}
                  />
                ))}
              </div>
            </section>
          )}

          {data.topItems.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Item usage
              </h3>
              <div className="space-y-1.5">
                {data.topItems.slice(0, 6).map((row) => (
                  <UsageBar key={row.item} label={row.item} pct={row.pct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
