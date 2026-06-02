import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getChampionsSpeciesList,
  type ChampionsSpeciesEntry,
} from '../data/championsSpecies'
import { PokemonSprite } from './PokemonSprite'

/** Cap search results; full list shown when query is empty (~186 species). */
const MAX_SEARCH_RESULTS = 100

export interface SpeciesSearchSelectProps {
  value: string | null
  onChange: (species: ChampionsSpeciesEntry) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Render search + results inline (no popover). Useful inside modals. */
  inline?: boolean
}

function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function SpeciesSearchSelect({
  value,
  onChange,
  placeholder = 'Search Pokémon…',
  disabled = false,
  className = '',
  inline = false,
}: SpeciesSearchSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allSpecies = useMemo(() => getChampionsSpeciesList(), [])

  const selected = useMemo(
    () => allSpecies.find((s) => s.id === value) ?? null,
    [allSpecies, value],
  )

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [useMobileSheet, setUseMobileSheet] = useState(false)

  const filtered = useMemo(() => {
    const q = normalizeSearch(query)
    if (!q) return allSpecies

    const out: ChampionsSpeciesEntry[] = []
    for (const s of allSpecies) {
      if (
        normalizeSearch(s.name).includes(q) ||
        normalizeSearch(s.id).includes(q) ||
        String(s.num).includes(q)
      ) {
        out.push(s)
        if (out.length >= MAX_SEARCH_RESULTS) break
      }
    }
    return out
  }, [allSpecies, query])

  const close = useCallback(() => {
    if (!inline) setOpen(false)
    setQuery('')
    setHighlight(0)
  }, [])

  const pick = useCallback(
    (species: ChampionsSpeciesEntry) => {
      onChange(species)
      close()
    },
    [onChange, close],
  )

  useEffect(() => {
    if (inline) return
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close, inline])

  useEffect(() => {
    if (inline) {
      setUseMobileSheet(false)
      return
    }
    const mq = window.matchMedia?.('(max-width: 639px)')
    if (!mq) return

    const pointerMq = window.matchMedia?.('(pointer: coarse)')
    const sync = () => setUseMobileSheet(Boolean(mq.matches && pointerMq?.matches))
    sync()

    mq.addEventListener('change', sync)
    pointerMq?.addEventListener?.('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      pointerMq?.removeEventListener?.('change', sync)
    }
  }, [])

  useEffect(() => {
    if (inline) return
    if (!open || !useMobileSheet) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open, useMobileSheet])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault()
      pick(filtered[highlight])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  if (inline) {
    return (
      <div ref={rootRef} className={`flex min-h-0 flex-1 flex-col ${className}`}>
        <div className="border-b border-showdown-border pb-3 dark:border-showdown-dark-border">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlight(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Name or Pokédex #…"
            className="w-full rounded border border-showdown-border bg-showdown-bg px-3 py-2 text-sm outline-none focus:border-showdown-accent dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            autoFocus
          />
          <p className="mt-1 text-[10px] text-gray-400">
            {filtered.length}
            {filtered.length >= MAX_SEARCH_RESULTS ? '+' : ''} results
          </p>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-gray-400">
              No Pokémon found
            </li>
          ) : (
            filtered.map((species, i) => (
              <li key={species.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm hover:bg-showdown-hover dark:hover:bg-showdown-dark-border/40 ${
                    i === highlight ? 'bg-showdown-hover dark:bg-showdown-dark-border/60' : ''
                  } ${value === species.id ? 'text-showdown-accent' : ''}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(species)}
                >
                  <PokemonSprite
                    speciesId={species.id}
                    speciesName={species.name}
                    nationalNum={species.num}
                  />
                  <span className="min-w-0 flex-1 truncate">{species.name}</span>
                  <span className="font-mono text-[10px] text-gray-400">
                    #{species.num}
                  </span>
                  <TypeBadges types={species.types} small />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((o) => !o)
          if (!open) setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="flex w-full min-w-0 items-center gap-2 rounded border border-showdown-border bg-white px-3 py-2 text-left text-sm hover:border-showdown-accent disabled:opacity-50 sm:px-2 sm:py-1.5 dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
      >
        {selected ? (
          <>
            <PokemonSprite
              speciesId={selected.id}
              speciesName={selected.name}
              nationalNum={selected.num}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {selected.name}
            </span>
            <TypeBadges types={selected.types} />
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="ml-auto text-gray-400" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <>
          {useMobileSheet && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
              onClick={close}
              aria-label="Close Pokémon search"
            />
          )}

          <div
            className={[
              // Mobile: bottom sheet
              'fixed inset-x-0 bottom-0 z-50 sm:absolute sm:bottom-auto sm:inset-auto',
              // Desktop: anchor under trigger and allow wider popover
              'sm:left-0 sm:mt-1 sm:w-[min(56rem,calc(100vw-1rem))] sm:min-w-[min(32rem,calc(100vw-1rem))]',
              // Shared panel styling
              'flex max-h-[80dvh] flex-col overflow-hidden border border-showdown-border bg-white shadow-xl',
              // Mobile rounding / safe area
              'rounded-t-xl sm:rounded-md',
              'dark:border-showdown-dark-border dark:bg-showdown-dark-panel',
            ].join(' ')}
            role="listbox"
            id={listId}
          >
            <div className="border-b border-showdown-border p-3 sm:p-2 dark:border-showdown-dark-border">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlight(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="Name or Pokédex #…"
                className="w-full rounded border border-showdown-border bg-showdown-bg px-3 py-2 text-sm outline-none focus:border-showdown-accent sm:px-2 sm:py-1.5 dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-1 text-[10px] text-gray-400">
                {filtered.length}
                {filtered.length >= MAX_SEARCH_RESULTS ? '+' : ''} results
              </p>
            </div>

            <ul
              className={`overflow-y-auto ${
                useMobileSheet
                  ? 'overscroll-contain pb-[max(env(safe-area-inset-bottom),0.75rem)]'
                  : 'pb-2'
              }`}
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-gray-400">
                  No Pokémon found
                </li>
              ) : (
                filtered.map((species, i) => (
                  <li
                    key={species.id}
                    role="option"
                    aria-selected={i === highlight}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-3 text-left text-sm hover:bg-showdown-hover sm:px-2 sm:py-1.5 dark:hover:bg-showdown-dark-border/40 ${
                        i === highlight
                          ? 'bg-showdown-hover dark:bg-showdown-dark-border/60'
                          : ''
                      } ${value === species.id ? 'text-showdown-accent' : ''}`}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(species)}
                    >
                      <PokemonSprite
                        speciesId={species.id}
                        speciesName={species.name}
                        nationalNum={species.num}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {species.name}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">
                        #{species.num}
                      </span>
                      <TypeBadges types={species.types} small />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function TypeBadges({
  types,
  small = false,
}: {
  types: string[]
  small?: boolean
}) {
  return (
    <span className={`flex shrink-0 gap-0.5 ${small ? 'scale-90' : ''}`}>
      {types.map((t) => (
        <span
          key={t}
          className={`rounded px-1 font-medium text-white type-${t.toLowerCase()} ${small ? 'text-[9px]' : 'text-[10px]'}`}
          style={{ backgroundColor: typeColor(t) }}
        >
          {t.slice(0, 3)}
        </span>
      ))}
    </span>
  )
}

function typeColor(type: string): string {
  const colors: Record<string, string> = {
    Normal: '#A8A878',
    Fire: '#F08030',
    Water: '#6890F0',
    Electric: '#F8D030',
    Grass: '#78C850',
    Ice: '#98D8D8',
    Fighting: '#C03028',
    Poison: '#A040A0',
    Ground: '#E0C068',
    Flying: '#A890F0',
    Psychic: '#F85888',
    Bug: '#A8B820',
    Rock: '#B8A038',
    Ghost: '#705898',
    Dragon: '#7038F8',
    Dark: '#705848',
    Steel: '#B8B8D0',
    Fairy: '#EE99AC',
    Stellar: '#73CEC5',
  }
  return colors[type] ?? '#777'
}
