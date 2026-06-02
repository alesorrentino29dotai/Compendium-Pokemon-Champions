import { formatTypeName, getTypeColor } from '../lib/typeColors'

export interface TypeBadgeProps {
  type: string
  /** Show abbreviated label (Fir) instead of full (Fire) */
  compact?: boolean
  className?: string
}

export function TypeBadge({ type, compact = false, className = '' }: TypeBadgeProps) {
  const label = formatTypeName(type)
  if (!label) return null

  const display = compact ? label.slice(0, 3) : label
  const typeClass = `pkmn-type-${label.toLowerCase()}`

  return (
    <span
      className={`pkmn-type ${typeClass} ${className}`}
      style={{ backgroundColor: getTypeColor(label) }}
    >
      {display}
    </span>
  )
}

export interface TypeBadgeRowProps {
  types: string[]
  compact?: boolean
  className?: string
}

export function TypeBadgeRow({ types, compact, className = '' }: TypeBadgeRowProps) {
  const normalized = types.map(formatTypeName).filter(Boolean)
  if (normalized.length === 0) return null

  return (
    <span className={`inline-flex flex-wrap gap-1.5 ${className}`}>
      {normalized.map((t) => (
        <TypeBadge key={t} type={t} compact={compact} />
      ))}
    </span>
  )
}
