import { loadDex } from '../../data/loadDex'
import type { PokemonSet } from '../../types/team'
import { PokemonSprite } from '../PokemonSprite'

export interface TeamGridProps {
  pokemon: (PokemonSet | null)[]
  selectedSlot: number | null
  onSelectSlot: (slot: number) => void
  onAddSlot: (slot: number) => void
  onAnalyzeSlot?: (slot: number) => void
}

export function TeamGrid({
  pokemon,
  selectedSlot,
  onSelectSlot,
  onAddSlot,
  onAnalyzeSlot,
}: TeamGridProps) {
  const dex = loadDex()

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
      {pokemon.map((mon, slot) => {
        const isSelected = selectedSlot === slot
        const isEmpty = !mon

        return (
          <button
            key={slot}
            type="button"
            onClick={() => (isEmpty ? onAddSlot(slot) : onSelectSlot(slot))}
            className={`group relative flex flex-col items-center rounded-lg border-2 p-2 transition-colors ${
              isSelected
                ? 'border-showdown-accent bg-showdown-hover dark:bg-showdown-dark-border/50'
                : 'border-showdown-border bg-white hover:border-showdown-accent/60 dark:border-showdown-dark-border dark:bg-showdown-dark-panel'
            } ${isEmpty ? 'border-dashed' : ''}`}
            aria-label={
              isEmpty ? `Add Pokémon slot ${slot + 1}` : mon.speciesName
            }
            aria-pressed={isSelected}
          >
            {mon ? (
              <>
                <PokemonSprite
                  speciesId={mon.speciesId}
                  speciesName={mon.speciesName}
                  nationalNum={dex.pokedex[mon.speciesId]?.num ?? 0}
                  size={56}
                  className="sm:h-16 sm:w-16"
                />
                <span className="mt-1 max-w-full truncate text-center text-[11px] font-medium leading-tight">
                  {mon.nickname || mon.speciesName}
                </span>
                {mon.item && (
                  <span className="mt-0.5 max-w-full truncate text-[9px] text-gray-400">
                    @ {mon.item}
                  </span>
                )}
                {onAnalyzeSlot && (
                  <span
                    role="presentation"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-full"
                  >
                    <button
                      type="button"
                      onClick={() => onAnalyzeSlot(slot)}
                      className="w-full rounded bg-showdown-accent/10 px-1 py-0.5 text-[9px] font-medium text-showdown-accent hover:bg-showdown-accent/20"
                    >
                      Analyze
                    </button>
                  </span>
                )}
              </>
            ) : (
              <div className="flex h-14 w-full flex-col items-center justify-center text-gray-400 sm:h-16">
                <span className="text-2xl leading-none">+</span>
                <span className="text-[10px]">Slot {slot + 1}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
