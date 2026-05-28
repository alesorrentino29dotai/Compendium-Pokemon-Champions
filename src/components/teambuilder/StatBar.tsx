import { useMemo } from 'react'

import type { NatureEntry, StatName } from '../../data/types'
import type { StatsRecord } from '../../types/team'
import {
  CHAMPIONS_FIXED_IV,
  MAX_SP_PER_STAT,
  MAX_SP_TOTAL,
} from '../../types/team'
import { clampStatPoints } from '../../lib/pokemonSet'
import { calcChampionsStats, isValidStatPointSpread, totalStatPoints } from '../../lib/stats'

const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

const STATS: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

export interface StatBarProps {
  evs: StatsRecord
  base: StatsRecord
  nature?: NatureEntry
  /** Replace full SP spread (teambuilder). */
  onEvsChange?: (sp: StatsRecord) => void
  /** Functional SP update — avoids stale state while dragging sliders (damage calc). */
  onEvsPatch?: (updater: (prev: StatsRecord) => StatsRecord) => void
}

function applySpChange(
  evs: StatsRecord,
  stat: StatName,
  value: number,
  onEvsChange?: (sp: StatsRecord) => void,
  onEvsPatch?: (updater: (prev: StatsRecord) => StatsRecord) => void,
) {
  const clamped = clampStatPoints(value)
  if (onEvsPatch) {
    onEvsPatch((prev) => ({ ...prev, [stat]: clamped }))
    return
  }
  onEvsChange?.({
    ...evs,
    [stat]: clamped,
  })
}

export function StatBar({
  evs,
  base,
  nature,
  onEvsChange,
  onEvsPatch,
}: StatBarProps) {
  const computed = useMemo(
    () => calcChampionsStats({ base, sp: evs, nature }),
    [evs, base, nature],
  )

  const spTotal = totalStatPoints(evs)
  const spOver = !isValidStatPointSpread(evs)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-600 dark:text-gray-300">
          Stat Points (SP)
        </span>
        <span className={spOver ? 'font-medium text-red-600' : 'text-gray-400'}>
          {spTotal} / {MAX_SP_TOTAL} SP
        </span>
      </div>

      <p className="text-[10px] leading-snug text-gray-400">
        Regole Pokémon Champions: ogni SP aggiunge +1 alla stat a liv. 50. IV
        fissi a {CHAMPIONS_FIXED_IV} (non influenzano il calcolo).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-1 pr-2 font-medium">Stat</th>
              <th className="pb-1 pr-2 font-medium">Base</th>
              <th className="pb-1 pr-2 font-medium">SP</th>
              <th className="pb-1 font-medium">Totale</th>
            </tr>
          </thead>
          <tbody>
            {STATS.map((stat) => (
              <tr
                key={stat}
                className="border-t border-showdown-border/60 dark:border-showdown-dark-border/60"
              >
                <td className="py-1.5 pr-2 font-medium">{STAT_LABELS[stat]}</td>
                <td className="py-1.5 pr-2 font-mono text-gray-400">
                  {base[stat]}
                </td>
                <td className="py-1.5 pr-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min={0}
                      max={MAX_SP_PER_STAT}
                      step={1}
                      value={evs[stat]}
                      onInput={(e) =>
                        applySpChange(
                          evs,
                          stat,
                          Number(e.currentTarget.value),
                          onEvsChange,
                          onEvsPatch,
                        )
                      }
                      onChange={(e) =>
                        applySpChange(
                          evs,
                          stat,
                          Number(e.target.value),
                          onEvsChange,
                          onEvsPatch,
                        )
                      }
                      className="w-14 accent-showdown-accent sm:w-20"
                    />
                    <input
                      type="number"
                      min={0}
                      max={MAX_SP_PER_STAT}
                      value={evs[stat]}
                      onInput={(e) =>
                        applySpChange(
                          evs,
                          stat,
                          Number(e.currentTarget.value),
                          onEvsChange,
                          onEvsPatch,
                        )
                      }
                      onChange={(e) =>
                        applySpChange(
                          evs,
                          stat,
                          Number(e.target.value),
                          onEvsChange,
                          onEvsPatch,
                        )
                      }
                      className="w-10 rounded border border-showdown-border bg-white px-1 py-0.5 font-mono dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
                    />
                  </div>
                </td>
                <td className="py-1.5 font-mono font-semibold text-showdown-accent">
                  {computed[stat]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
