import { useEffect } from 'react'

import type { ChampionsSpeciesEntry } from '../../data/championsSpecies'
import { getChampionsSpeciesList } from '../../data/championsSpecies'
import { PokemonSprite } from '../PokemonSprite'
import { SpeciesSearchSelect } from '../SpeciesSearchSelect'

export interface SpeciesPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (species: ChampionsSpeciesEntry) => void
  title?: string
}

export function SpeciesPickerModal({
  open,
  onClose,
  onSelect,
  title = 'Seleziona Pokémon',
}: SpeciesPickerModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSelect = (entry: ChampionsSpeciesEntry) => {
    onSelect(entry)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="species-picker-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-showdown-border bg-showdown-panel shadow-xl sm:rounded-lg dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-showdown-border px-4 py-3 dark:border-showdown-dark-border">
          <h2 id="species-picker-title" className="font-medium">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-2 text-gray-500 hover:bg-showdown-hover dark:hover:bg-showdown-dark-border"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <SpeciesSearchSelect
            value={null}
            onChange={handleSelect}
            placeholder="Cerca per nome o n° dex…"
          />

          <p className="mt-4 mb-2 text-xs text-gray-400">
            Popolari (tocca per aggiungere)
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {POPULAR_SPECIES.map((id) => {
              const entry = getChampionsSpeciesList().find((s) => s.id === id)
              if (!entry) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(entry)}
                  className="flex flex-col items-center gap-1 rounded border border-showdown-border p-2 hover:border-showdown-accent hover:bg-showdown-hover dark:border-showdown-dark-border dark:hover:bg-showdown-dark-border/40"
                >
                  <PokemonSprite
                    speciesId={entry.id}
                    speciesName={entry.name}
                    nationalNum={entry.num}
                    size={48}
                  />
                  <span className="max-w-full truncate text-[10px]">
                    {entry.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const POPULAR_SPECIES = [
  'incineroar',
  'rillaboom',
  'landorustherian',
  'urshifu',
  'fluttermane',
  'ironhands',
  'chienpao',
  'gholdengo',
  'pikachu',
  'charizard',
].filter((id) => getChampionsSpeciesList().some((s) => s.id === id))
