import type { NatureSpeedCase } from '../../lib/speedTiers'

const OPTIONS: { id: NatureSpeedCase; label: string; activeClass: string }[] = [
  {
    id: 'positive',
    label: '+Spe',
    activeClass:
      'bg-emerald-600 text-white dark:bg-emerald-700',
  },
  {
    id: 'neutral',
    label: 'Neutro',
    activeClass: 'bg-gray-600 text-white dark:bg-gray-500',
  },
  {
    id: 'negative',
    label: '−Spe',
    activeClass: 'bg-rose-600 text-white dark:bg-rose-700',
  },
]

export interface NatureCasePickerProps {
  value: NatureSpeedCase
  onChange: (value: NatureSpeedCase) => void
}

export function NatureCasePicker({ value, onChange }: NatureCasePickerProps) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-md border border-showdown-border text-[10px] font-medium dark:border-showdown-dark-border"
      role="group"
      aria-label="Natura velocità"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-2 py-1 transition-colors ${
            value === opt.id
              ? opt.activeClass
              : 'bg-white text-gray-600 hover:bg-showdown-hover dark:bg-showdown-dark-bg dark:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
