import type { StatName } from '../../data/types'
import type { StatsRecord } from '../../types/team'

const BOOST_STATS: StatName[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

const STAGES = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] as const

function stageLabel(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
}

export interface CalcBoostsProps {
  boosts: Partial<StatsRecord>
  onChange: (boosts: Partial<StatsRecord>) => void
}

export function CalcBoosts({ boosts, onChange }: CalcBoostsProps) {
  const patch = (stat: StatName, value: number) => {
    const next = { ...boosts }
    if (value === 0) {
      delete next[stat]
    } else {
      next[stat] = value
    }
    onChange(next)
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
        Boost stat
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {BOOST_STATS.map((stat) => (
          <label key={stat} className="text-xs text-gray-500">
            {STAT_LABELS[stat]}
            <select
              value={boosts[stat] ?? 0}
              onChange={(e) => patch(stat, Number(e.target.value))}
              className="mt-0.5 w-full rounded border border-showdown-border bg-white px-1 py-1 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}
