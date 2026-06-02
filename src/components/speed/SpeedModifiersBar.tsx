import type { SpeedModifiers } from '../../lib/stats'
import { CheckboxField } from '../ui/CheckboxField'

const STAGE_OPTIONS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] as const

function stageLabel(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
}

export interface SpeedModifiersBarProps {
  mods: SpeedModifiers
  onChange: (patch: Partial<SpeedModifiers>) => void
  compact?: boolean
}

export function SpeedModifiersBar({
  mods,
  onChange,
  compact,
}: SpeedModifiersBarProps) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <CheckboxField
          label="Choice Scarf"
          checked={!!mods.choiceScarf}
          onChange={(v) => onChange({ choiceScarf: v })}
        />
        <CheckboxField
          label="Tailwind"
          checked={!!mods.tailwind}
          onChange={(v) => onChange({ tailwind: v })}
        />
        <CheckboxField
          label="Paralysis"
          checked={!!mods.paralysis}
          onChange={(v) => onChange({ paralysis: v })}
        />
      </div>
      <label className="block text-xs text-gray-500">
        Speed stage
        <select
          value={mods.statStages ?? 0}
          onChange={(e) => onChange({ statStages: Number(e.target.value) })}
          className="mt-1 block w-full max-w-[8rem] rounded-md border border-showdown-border bg-white px-2 py-1.5 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
        >
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
