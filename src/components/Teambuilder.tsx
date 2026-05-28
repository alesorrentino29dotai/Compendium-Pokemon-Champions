import { useCallback, useMemo, useState } from 'react'

import type { ChampionsSpeciesEntry } from '../data/championsSpecies'
import { loadDex } from '../data/loadDex'
import { createEmptyPokemonSet } from '../lib/pokemonSet'
import { useTeamStore } from '../store/useTeamStore'
import { PokemonEditor } from './teambuilder/PokemonEditor'
import { SpeciesPickerModal } from './teambuilder/SpeciesPickerModal'
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
  const updatePokemon = useTeamStore((s) => s.updatePokemon)

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

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
          Crea il tuo team VGC Regulation M-A (6 Pokémon, livello 50).
        </p>
        <button
          type="button"
          onClick={() => createTeam()}
          className="rounded bg-showdown-accent px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Nuovo team
        </button>
      </section>
    )
  }

  const active = team ?? teams[0]
  const selectedMon =
    effectiveSelectedSlot !== null
      ? active.pokemon[effectiveSelectedSlot]
      : null

  return (
    <>
      <section className="rounded-lg border border-showdown-border bg-showdown-panel shadow-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-showdown-border px-4 py-3 dark:border-showdown-dark-border">
          {teams.length > 1 &&
            teams.map((t) => (
              <button
                key={t.id}
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

          <input
            className="min-w-[8rem] flex-1 rounded border border-showdown-border bg-white px-2 py-1 text-sm font-medium dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
            value={active.name}
            onChange={(e) => renameTeam(active.id, e.target.value)}
            aria-label="Nome team"
          />

          <div className="ml-auto flex flex-wrap gap-2">
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
              Duplica
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
                Elimina
              </button>
            )}
          </div>
        </div>

        {/* Team grid */}
        <div className="border-b border-showdown-border p-4 dark:border-showdown-dark-border">
          <p className="mb-3 text-xs text-gray-500">
            Reg M-A · Tocca uno slot per modificare, o + per aggiungere
          </p>
          <TeamGrid
            pokemon={active.pokemon}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            onAddSlot={(slot) => setPickerSlot(slot)}
          />
        </div>

        {/* Editor panel */}
        <div className="p-4 md:p-6">
          {selectedMon && effectiveSelectedSlot !== null ? (
            <PokemonEditor
              set={selectedMon}
              onChange={(patch) =>
                updatePokemon(active.id, effectiveSelectedSlot, patch)
              }
              onClear={() => {
                setSlot(active.id, effectiveSelectedSlot, null)
                setSelectedSlot(null)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-gray-400">
              <p>Seleziona un Pokémon dalla squadra</p>
              <p className="mt-1 text-xs">
                oppure tocca + su uno slot vuoto
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
            ? `Slot ${pickerSlot + 1} — Scegli Pokémon`
            : 'Seleziona Pokémon'
        }
      />
    </>
  )
}
