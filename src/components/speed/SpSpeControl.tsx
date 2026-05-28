import { clampStatPoints } from '../../lib/pokemonSet'
import { MAX_SP_PER_STAT } from '../../types/team'

export interface SpSpeControlProps {
  value: number
  onChange: (value: number) => void
}

export function SpSpeControl({ value, onChange }: SpSpeControlProps) {
  const apply = (raw: number) => {
    onChange(clampStatPoints(raw))
  }

  return (
    <div className="flex w-full max-w-[8rem] flex-col items-stretch gap-1 sm:max-w-none sm:items-center">
      <input
        type="range"
        min={0}
        max={MAX_SP_PER_STAT}
        step={1}
        value={value}
        onInput={(e) => apply(Number(e.currentTarget.value))}
        onChange={(e) => apply(Number(e.target.value))}
        className="h-2 w-full min-w-0 accent-showdown-accent sm:h-1.5 sm:w-20"
        aria-label="SP Velocità"
      />
      <input
        type="number"
        min={0}
        max={MAX_SP_PER_STAT}
        value={value}
        onInput={(e) => apply(Number(e.currentTarget.value))}
        onChange={(e) => apply(Number(e.target.value))}
        className="w-full rounded border border-showdown-border bg-white px-1 py-1 text-center font-mono text-sm font-semibold text-showdown-accent focus:border-showdown-accent focus:outline-none focus:ring-1 focus:ring-showdown-accent dark:border-showdown-dark-border dark:bg-showdown-dark-bg sm:w-11"
      />
    </div>
  )
}
