import { useState } from 'react'

import type { SpeedModifiers } from '../lib/stats'
import { useTeamStore } from '../store/useTeamStore'
import { ReferenceSpeedGrid } from './speed/ReferenceSpeedGrid'
import { TeamSpeedPanel } from './speed/TeamSpeedPanel'

function defaultSpeedModifiers(): SpeedModifiers {
  return {
    choiceScarf: false,
    tailwind: false,
    paralysis: false,
    statStages: 0,
  }
}

export function SpeedTiers() {
  const teams = useTeamStore((s) => s.teams)
  const activeTeamId = useTeamStore((s) => s.activeTeamId)
  const updatePokemon = useTeamStore((s) => s.updatePokemon)

  const [teamMods, setTeamMods] = useState<SpeedModifiers>(defaultSpeedModifiers)
  const [refMods, setRefMods] = useState<SpeedModifiers>(defaultSpeedModifiers)

  const team =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium">Speed Tiers</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Velocità Champions a liv. 50. Modifica SP e natura (+Spe / neutro / −Spe)
          sul team o sul database; gli aggiornamenti sono immediati.
        </p>
      </header>

      {team ? (
        <TeamSpeedPanel
          teamName={team.name}
          pokemon={team.pokemon}
          mods={teamMods}
          onModsChange={(patch) => setTeamMods((m) => ({ ...m, ...patch }))}
          onUpdatePokemon={(slot, patch) =>
            updatePokemon(team.id, slot, patch)
          }
        />
      ) : (
        <section className="rounded-lg border border-showdown-border bg-showdown-panel p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
          <p className="text-sm text-gray-500">
            Nessun team attivo. Creane uno dal Teambuilder.
          </p>
        </section>
      )}

      <ReferenceSpeedGrid
        mods={refMods}
        onModsChange={(patch) => setRefMods((m) => ({ ...m, ...patch }))}
      />
    </div>
  )
}
