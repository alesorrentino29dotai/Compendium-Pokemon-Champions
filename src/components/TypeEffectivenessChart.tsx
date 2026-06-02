import type { TypeEffectiveness } from '../lib/typeEffectiveness'
import { TypeBadge } from './TypeBadge'

interface EffectivenessCardProps {
  title: string
  types: string[]
  panelClass: string
}

function EffectivenessCard({ title, types, panelClass }: EffectivenessCardProps) {
  return (
    <div
      className={`min-h-[4.5rem] rounded-lg border border-black/[0.06] p-3 ${panelClass}`}
    >
      <h4 className="mb-2.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {title}
      </h4>
      {types.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
      )}
    </div>
  )
}

export interface TypeEffectivenessChartProps {
  effectiveness: TypeEffectiveness
}

/** Defensive type chart styled like Pokémon Zone (4× / 2× weak, ½× / ¼× resist). */
export function TypeEffectivenessChart({
  effectiveness,
}: TypeEffectivenessChartProps) {
  return (
    <section aria-labelledby="type-effectiveness-heading">
      <h3
        id="type-effectiveness-heading"
        className="mb-3 text-sm font-bold tracking-wide text-slate-600 uppercase dark:text-slate-300"
      >
        Type effectiveness
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EffectivenessCard
          title="Weakness · 4×"
          types={effectiveness.weak4x}
          panelClass="bg-[var(--color-eff-weak-4)] dark:bg-red-950/45"
        />
        <EffectivenessCard
          title="Weakness · 2×"
          types={effectiveness.weak2x}
          panelClass="bg-[var(--color-eff-weak-2)] dark:bg-orange-950/40"
        />
        <EffectivenessCard
          title="Resistance · ½×"
          types={effectiveness.resist2x}
          panelClass="bg-[var(--color-eff-resist-2)] dark:bg-emerald-950/40"
        />
        <EffectivenessCard
          title="Resistance · ¼×"
          types={effectiveness.resist4x}
          panelClass="bg-[var(--color-eff-resist-4)] dark:bg-lime-950/35"
        />
      </div>
      {effectiveness.immune.length > 0 && (
        <div className="mt-3 min-h-[4.5rem] rounded-lg border border-black/[0.06] bg-slate-100 p-3 dark:bg-slate-800/60">
          <h4 className="mb-2.5 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
            Immunity · 0×
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {effectiveness.immune.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
