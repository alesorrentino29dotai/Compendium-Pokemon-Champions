import { useMemo, useState } from 'react'

import type { SpeedModifiers } from '../lib/stats'
import { useTeamStore } from '../store/useTeamStore'
import type { PokemonSet, StatsRecord } from '../types/team'
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

  const [teamMods, setTeamMods] = useState<SpeedModifiers>(defaultSpeedModifiers)
  const [refMods, setRefMods] = useState<SpeedModifiers>(defaultSpeedModifiers)
  const [localOverrides, setLocalOverrides] = useState<
    Record<number, { nature?: PokemonSet['nature']; spe?: number }>
  >({})

  const team =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null

  const previewPokemon = useMemo(() => {
    if (!team) return []
    return team.pokemon.map((p, i) => {
      if (!p) return null
      const ovr = localOverrides[i]
      if (!ovr) return p

      const next: PokemonSet = { ...p }
      if (ovr.nature) next.nature = ovr.nature
      if (typeof ovr.spe === 'number') {
        const evs: StatsRecord = { ...next.evs, spe: ovr.spe }
        next.evs = evs
      }
      return next
    })
  }, [team, localOverrides])

  const patchOverride = (
    slot: number,
    patch: { nature?: PokemonSet['nature']; spe?: number },
  ) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], ...patch },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium">Speed Tiers</h2>
      </header>

      {team ? (
        <TeamSpeedPanel
          teamName={team.name}
          pokemon={previewPokemon}
          mods={teamMods}
          onModsChange={(patch) => setTeamMods((m) => ({ ...m, ...patch }))}
          onOverrideChange={patchOverride}
        />
      ) : (
        <section className="rounded-lg border border-showdown-border bg-showdown-panel p-4 dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
          <p className="text-sm text-gray-500">
            No active team. Create one in the Teambuilder tab.
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
