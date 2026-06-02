import { useMemo } from 'react'

import {
  findTeamCompleteSuggestions,
  getSpeciesName,
  type TeamCompleteSuggestion,
  type TeamSuggestionKind,
} from '../../lib/vgcTeams'
import type { PokemonSet } from '../../types/team'

export interface TeamCompleteModalProps {
  open: boolean
  onClose: () => void
  pokemon: (PokemonSet | null)[]
  onApply: (suggestion: TeamCompleteSuggestion) => void
}

const KIND_LABEL: Record<TeamSuggestionKind, string> = {
  exact: 'Exact match',
  partial: 'Similar team',
  guest: 'Suggested teammates',
}

const KIND_BADGE: Record<TeamSuggestionKind, string> = {
  exact: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  partial: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  guest: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
}

function SuggestionCard({
  suggestion,
  selectedCount,
  onPick,
}: {
  suggestion: TeamCompleteSuggestion
  selectedCount: number
  onPick: () => void
}) {
  const { kind, team, missingSpecies, overlapCount } = suggestion

  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full rounded-lg border border-showdown-border px-3 py-2.5 text-left text-sm hover:border-showdown-accent hover:bg-showdown-hover dark:border-showdown-dark-border"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${KIND_BADGE[kind]}`}
        >
          {KIND_LABEL[kind]}
        </span>
        <span className="font-medium">
          {kind === 'guest' ? 'Meta suggestion' : team.id}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {kind === 'guest'
            ? `${missingSpecies.length} suggested`
            : `${overlapCount} of ${selectedCount} picks`}
        </span>
      </div>
      {team.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
          {team.description}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        {team.speciesIds.map(getSpeciesName).join(' · ')}
      </p>
      {missingSpecies.length > 0 && (
        <p className="mt-1 text-[10px] text-showdown-accent">
          Will add: {missingSpecies.map(getSpeciesName).join(', ')}
        </p>
      )}
      {kind === 'partial' && (
        <p className="mt-1 text-[10px] text-gray-400">
          Does not include all your picks — fills gaps from this roster
        </p>
      )}
      {kind === 'guest' && (
        <p className="mt-1 text-[10px] text-gray-400">
          Builds from most-used sets in the spreadsheet
        </p>
      )}
    </button>
  )
}

export function TeamCompleteModal({
  open,
  onClose,
  pokemon,
  onApply,
}: TeamCompleteModalProps) {
  const selectedCount = useMemo(
    () => pokemon.filter(Boolean).length,
    [pokemon],
  )

  const selectedIds = useMemo(
    () =>
      pokemon
        .filter((p): p is PokemonSet => p !== null)
        .map((p) => p.speciesId),
    [pokemon],
  )

  const suggestions = useMemo(
    () => findTeamCompleteSuggestions(selectedIds),
    [selectedIds],
  )

  const grouped = useMemo(() => {
    const exact = suggestions.filter((s) => s.kind === 'exact')
    const partial = suggestions.filter((s) => s.kind === 'partial')
    const guest = suggestions.filter((s) => s.kind === 'guest')
    return { exact, partial, guest }
  }, [suggestions])

  if (!open) return null

  const hasAny =
    grouped.exact.length > 0 ||
    grouped.partial.length > 0 ||
    grouped.guest.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-showdown-border bg-showdown-panel shadow-xl sm:rounded-xl dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-showdown-border px-4 py-3 dark:border-showdown-dark-border">
          <h2 id="complete-title" className="text-lg font-semibold">
            Complete team
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Exact teams from VGCPastes, similar rosters that share your picks,
            or guest fills from the most common teammates and meta builds.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
          {!hasAny ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No suggestions found. Select at least 2 Pokémon.
            </p>
          ) : (
            <>
              {grouped.guest.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Suggested teammates
                  </h3>
                  <ul className="space-y-2">
                    {grouped.guest.map((s) => (
                      <li key={s.team.id}>
                        <SuggestionCard
                          suggestion={s}
                          selectedCount={selectedCount}
                          onPick={() => {
                            onApply(s)
                            onClose()
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {grouped.exact.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Exact matches
                  </h3>
                  <ul className="space-y-2">
                    {grouped.exact.map((s) => (
                      <li key={s.team.id}>
                        <SuggestionCard
                          suggestion={s}
                          selectedCount={selectedCount}
                          onPick={() => {
                            onApply(s)
                            onClose()
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {grouped.partial.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Similar teams
                  </h3>
                  <ul className="space-y-2">
                    {grouped.partial.map((s) => (
                      <li key={`${s.kind}-${s.team.id}`}>
                        <SuggestionCard
                          suggestion={s}
                          selectedCount={selectedCount}
                          onPick={() => {
                            onApply(s)
                            onClose()
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="border-t border-showdown-border px-4 py-2 dark:border-showdown-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded py-2 text-sm text-gray-600 hover:bg-showdown-hover"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
