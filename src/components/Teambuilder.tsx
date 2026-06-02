import { useCallback, useMemo, useState } from 'react'

import type { ChampionsSpeciesEntry } from '../data/championsSpecies'
import { loadDex } from '../data/loadDex'
import { createEmptyPokemonSet } from '../lib/pokemonSet'
import { exportTeamChampions, exportTeamShowdown } from '../lib/teamExport'
import { applyVgcTeamToSlots } from '../lib/vgcTeams'
import { useTeamStore } from '../store/useTeamStore'
import { PokemonAnalyzeModal } from './teambuilder/PokemonAnalyzeModal'
import { PokemonEditor } from './teambuilder/PokemonEditor'
import { SpeciesPickerModal } from './teambuilder/SpeciesPickerModal'
import { TeamCompleteModal } from './teambuilder/TeamCompleteModal'
import { TeamGrid } from './teambuilder/TeamGrid'

export function Teambuilder() {
  const dex = loadDex()
  const teams = useTeamStore((s) => s.teams)
  const activeTeamId = useTeamStore((s) => s.activeTeamId)
  const createTeam = useTeamStore((s) => s.createTeam)
  const deleteTeam = useTeamStore((s) => s.deleteTeam)
  const duplicateTeam = useTeamStore((s) => s.duplicateTeam)
  const setActiveTeam = useTeamStore((s) => s.setActiveTeam)
  const renameTeam = useTeamStore((s) => s.renameTeam)
  const setSlot = useTeamStore((s) => s.setSlot)
  const setAllSlots = useTeamStore((s) => s.setAllSlots)
  const updatePokemon = useTeamStore((s) => s.updatePokemon)

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [analyzeSlot, setAnalyzeSlot] = useState<number | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)

  const team =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null

  const effectiveSelectedSlot = useMemo(() => {
    if (!team) return null
    if (
      selectedSlot !== null &&
      team.pokemon[selectedSlot] !== null
    ) {
      return selectedSlot
    }
    const firstFilled = team.pokemon.findIndex((p) => p !== null)
    return firstFilled === -1 ? null : firstFilled
  }, [team, selectedSlot])

  const ensureTeam = useCallback(() => {
    if (team) return team.id
    const id = createTeam('Team 1')
    return id
  }, [team, createTeam])

  const handleSpeciesPick = (entry: ChampionsSpeciesEntry) => {
    const slot = pickerSlot
    if (slot === null) return

    const teamId = ensureTeam()
    const species = dex.pokedex[entry.id]
    if (!species) return

    setSlot(teamId, slot, createEmptyPokemonSet(entry.id, species))
    setSelectedSlot(slot)
    setPickerSlot(null)
  }

  if (!team && teams.length === 0) {
    return (
      <section className="rounded-lg border border-showdown-border bg-showdown-panel p-8 text-center shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        <h2 className="mb-2 text-xl font-medium">Teambuilder</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Create your team (6 Pokémon, level 50).
        </p>
        <button
          type="button"
          onClick={() => createTeam()}
          className="rounded bg-showdown-accent px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          New team
        </button>
      </section>
    )
  }

  const active = team ?? teams[0]
  const selectedMon =
    effectiveSelectedSlot !== null
      ? active.pokemon[effectiveSelectedSlot]
      : null

  const filledCount = active.pokemon.filter(Boolean).length
  const analyzeMon =
    analyzeSlot !== null ? active.pokemon[analyzeSlot] : null

  return (
    <>
      <section className="rounded-lg border border-showdown-border bg-showdown-panel shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-showdown-border px-3 py-2.5 sm:px-4 sm:py-3 dark:border-showdown-dark-border">
          {teams.length > 1 && (
            <>
              {/* Mobile / many teams: compact selector to avoid overflowing UI */}
              <label className="flex w-full items-center gap-2 text-xs text-gray-500 sm:w-auto">
                <span className="shrink-0">Team</span>
                <select
                  value={active.id}
                  onChange={(e) => {
                    setActiveTeam(e.target.value)
                    setSelectedSlot(null)
                  }}
                  className="w-full min-w-0 flex-1 rounded border border-showdown-border bg-white px-2 py-1 text-sm font-medium dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Desktop / few teams: keep quick buttons */}
              {teams.length <= 4 && (
                <div className="hidden flex-wrap gap-1 md:flex">
                  {teams.map((t) => (
                    <button
                      key={`btn-${t.id}`}
                      type="button"
                      onClick={() => {
                        setActiveTeam(t.id)
                        setSelectedSlot(null)
                      }}
                      className={`rounded px-2.5 py-1 text-xs ${
                        t.id === active.id
                          ? 'bg-showdown-accent text-white'
                          : 'border border-showdown-border dark:border-showdown-dark-border'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <input
            className="min-w-[8rem] flex-1 rounded border border-showdown-border bg-white px-2 py-1 text-sm font-medium dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            value={active.name}
            onChange={(e) => renameTeam(active.id, e.target.value)}
            aria-label="Team name"
          />

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={filledCount < 2}
              onClick={() => setCompleteOpen(true)}
              className="rounded border border-showdown-border px-2 py-1 text-xs hover:bg-showdown-hover disabled:cursor-not-allowed disabled:opacity-40 dark:border-showdown-dark-border"
              title={
                filledCount < 2
                  ? 'Select at least 2 Pokémon to suggest teams from the VGC sheet'
                  : 'Complete team from VGCPastes spreadsheet'
              }
            >
              Complete team
            </button>
            <button
              type="button"
              onClick={async () => {
                const text = exportTeamShowdown(active)
                if (!text) return
                await navigator.clipboard.writeText(text)
              }}
              className="rounded border border-showdown-border px-2 py-1 text-xs hover:bg-showdown-hover dark:border-showdown-dark-border"
              title="Copy team to clipboard (Pokémon Showdown format)"
            >
              Export (Showdown)
            </button>
            <button
              type="button"
              onClick={async () => {
                const text = exportTeamChampions(active)
                if (!text) return
                await navigator.clipboard.writeText(text)
              }}
              className="rounded border border-showdown-border px-2 py-1 text-xs hover:bg-showdown-hover dark:border-showdown-dark-border"
              title="Copy team to clipboard (Pokémon Champions format)"
            >
              Export (Champions)
            </button>
            <button
              type="button"
              onClick={() => createTeam()}
              className="rounded border border-showdown-border px-2 py-1 text-xs hover:bg-showdown-hover dark:border-showdown-dark-border"
            >
              + Team
            </button>
            <button
              type="button"
              onClick={() => duplicateTeam(active.id)}
              className="rounded border border-showdown-border px-2 py-1 text-xs hover:bg-showdown-hover dark:border-showdown-dark-border"
            >
              Duplicate
            </button>
            {teams.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  deleteTeam(active.id)
                  setSelectedSlot(null)
                }}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Team grid */}
        <div className="border-b border-showdown-border p-3 sm:p-4 dark:border-showdown-dark-border">
          <p className="mb-3 text-xs text-gray-500">
            Tap a slot to edit, or + to add.
          </p>
          <TeamGrid
            pokemon={active.pokemon}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            onAddSlot={(slot) => setPickerSlot(slot)}
            onAnalyzeSlot={(slot) => setAnalyzeSlot(slot)}
          />
        </div>

        {/* Editor panel */}
        <div className="p-3 sm:p-4 md:p-6">
          {selectedMon && effectiveSelectedSlot !== null ? (
            <PokemonEditor
              set={selectedMon}
              onChange={(patch) =>
                updatePokemon(active.id, effectiveSelectedSlot, patch)
              }
              onAnalyze={() => setAnalyzeSlot(effectiveSelectedSlot)}
              onClear={() => {
                setSlot(active.id, effectiveSelectedSlot, null)
                setSelectedSlot(null)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-400">
              <p>Select a Pokémon from the team</p>
              <p className="mt-1 text-xs">
                or tap + on an empty slot
              </p>
            </div>
          )}
        </div>
      </section>

      <SpeciesPickerModal
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={handleSpeciesPick}
        title={
          pickerSlot !== null
            ? `Slot ${pickerSlot + 1} — Choose Pokémon`
            : 'Choose Pokémon'
        }
      />

      {analyzeMon && (
        <PokemonAnalyzeModal
          set={analyzeMon}
          open={analyzeSlot !== null}
          onClose={() => setAnalyzeSlot(null)}
        />
      )}

      <TeamCompleteModal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        pokemon={active.pokemon}
        onApply={(suggestion) => {
          const next = applyVgcTeamToSlots(suggestion.team, active.pokemon)
          setAllSlots(active.id, next)
        }}
      />
    </>
  )
}
