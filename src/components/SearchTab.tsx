import { useMemo, useState } from 'react'

import { getChampionsSpeciesList } from '../data/championsSpecies'
import { loadDex } from '../data/loadDex'
import { toId } from '../lib/toId'
import { PokemonSprite } from './PokemonSprite'

type SearchMode = 'move' | 'ability'

function normalizeQuery(value: string): string {
  return value.trim()
}

export function SearchTab() {
  const dex = loadDex()
  const champions = getChampionsSpeciesList()

  const [mode, setMode] = useState<SearchMode>('move')
  const [query, setQuery] = useState('')

  const { moveIndex, abilityIndex, moveOptions, abilityOptions } = useMemo(() => {
    const allowed = new Set(champions.map((s) => s.id))

    const moveIndex = new Map<string, string[]>()
    const abilityIndex = new Map<string, string[]>()

    const moveOptionsSet = new Set<string>()
    const abilityOptionsSet = new Set<string>()

    for (const speciesId of allowed) {
      const species = dex.pokedex[speciesId]
      if (!species) continue

      // Abilities
      if (species.abilities) {
        for (const ability of Object.values(species.abilities)) {
          if (typeof ability !== 'string' || !ability) continue
          abilityOptionsSet.add(ability)
          const key = toId(ability)
          const prev = abilityIndex.get(key)
          if (prev) prev.push(speciesId)
          else abilityIndex.set(key, [speciesId])
        }
      }

      // Moves (learnsets)
      const learnset = dex.learnsets[speciesId]?.learnset
      if (learnset) {
        for (const moveId of Object.keys(learnset)) {
          const move = dex.moves[moveId]
          if (!move?.name) continue
          moveOptionsSet.add(move.name)
          const key = toId(move.name)
          const prev = moveIndex.get(key)
          if (prev) prev.push(speciesId)
          else moveIndex.set(key, [speciesId])
        }
      }
    }

    const moveOptions = [...moveOptionsSet].sort((a, b) => a.localeCompare(b))
    const abilityOptions = [...abilityOptionsSet].sort((a, b) =>
      a.localeCompare(b),
    )

    return { moveIndex, abilityIndex, moveOptions, abilityOptions }
  }, [dex, champions])

  const normalized = normalizeQuery(query)
  const key = toId(normalized)

  const hits = useMemo(() => {
    if (!normalized) return []
    const ids = (mode === 'move' ? moveIndex.get(key) : abilityIndex.get(key)) ?? []
    const unique = [...new Set(ids)]
    unique.sort((a, b) => {
      const an = dex.pokedex[a]?.name ?? a
      const bn = dex.pokedex[b]?.name ?? b
      return an.localeCompare(bn)
    })
    return unique
  }, [normalized, mode, moveIndex, abilityIndex, key, dex])

  const options = mode === 'move' ? moveOptions : abilityOptions

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium">Search</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Cerca una mossa o un’abilità e ottieni i Pokémon Champions che la
          possiedono.
        </p>
      </header>

      <section className="rounded-lg border border-showdown-border bg-showdown-panel p-3 shadow-sm sm:p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-xs text-gray-500">
            Tipo ricerca
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as SearchMode)
                setQuery('')
              }}
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            >
              <option value="move">Mossa</option>
              <option value="ability">Abilità</option>
            </select>
          </label>

          <label className="flex-1 text-xs text-gray-500">
            {mode === 'move' ? 'Mossa' : 'Abilità'}
            <input
              list={mode === 'move' ? 'move-options' : 'ability-options'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'move' ? 'Es. Protect' : 'Es. Intimidate'}
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            />
          </label>
        </div>

        <datalist id="move-options">
          {moveOptions.slice(0, 5000).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id="ability-options">
          {abilityOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="mt-4 border-t border-showdown-border/60 pt-4 dark:border-showdown-dark-border/60">
          {!normalized ? (
            <p className="text-sm text-gray-500">
              Inizia a digitare per vedere i Pokémon corrispondenti.
            </p>
          ) : hits.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nessun Pokémon trovato per: <span className="font-medium">{normalized}</span>
            </p>
          ) : (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-showdown-accent">
                {hits.length} risultati
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {hits.map((speciesId) => {
                  const s = dex.pokedex[speciesId]
                  const label = s?.name ?? speciesId
                  return (
                    <div
                      key={speciesId}
                      className="flex items-center gap-2 rounded border border-showdown-border/70 bg-white/50 p-2 dark:border-showdown-dark-border/70 dark:bg-showdown-dark-bg/40"
                    >
                      <PokemonSprite
                        speciesId={speciesId}
                        speciesName={label}
                        nationalNum={s?.num ?? 0}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="truncate text-[10px] text-gray-500">{speciesId}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {normalized && options.length > 0 && (
            <p className="mt-4 text-[10px] text-gray-400">
              Suggerimenti: {mode === 'move' ? 'mosse' : 'abilità'} indicizzate:
              {' '}
              {options.length.toLocaleString()}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

