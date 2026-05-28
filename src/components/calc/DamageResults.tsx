import {
  NOT_EFFECTIVE_LABEL,
  type MoveDamageResult,
} from '../../lib/smogonCalc'

export interface DamageResultsProps {
  attackerLabel: string
  defenderLabel: string
  attackerToDefender: MoveDamageResult[]
  defenderToAttacker: MoveDamageResult[]
}

function MoveTable({
  title,
  rows,
}: {
  title: string
  rows: MoveDamageResult[]
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-showdown-accent">{title}</h4>
        <p className="text-sm text-gray-500">Nessuna mossa configurata.</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-showdown-accent">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-showdown-border text-left text-xs text-gray-500 dark:border-showdown-dark-border">
              <th className="py-2 pr-3 font-medium">Mossa</th>
              <th className="py-2 pr-3 font-medium">Danno</th>
              <th className="py-2 pr-3 font-medium">%</th>
              <th className="py-2 font-medium">KO / effetto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.slot}-${row.move}`}
                className="border-b border-showdown-border/50 dark:border-showdown-dark-border/50"
              >
                <td className="py-2 pr-3 font-medium">
                  {row.move}
                  {row.isCrit && (
                    <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Crit
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 font-mono text-showdown-accent">
                  {row.notEffective ? (
                    <span className="text-gray-500">{NOT_EFFECTIVE_LABEL}</span>
                  ) : row.ok ? (
                    <>
                      {row.min}–{row.max}
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 font-mono">
                  {row.notEffective ? (
                    <span className="text-gray-500">—</span>
                  ) : row.ok ? (
                    <>
                      {row.minPct}–{row.maxPct}%
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 text-xs text-gray-600 dark:text-gray-300">
                  {row.notEffective
                    ? NOT_EFFECTIVE_LABEL
                    : (row.koText ?? (row.ok ? '—' : row.description))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 space-y-1.5 border-t border-showdown-border/60 pt-3 dark:border-showdown-dark-border/60">
        {rows.map(
          (row) =>
            (row.ok || row.notEffective) && (
              <li
                key={`desc-${row.slot}-${row.move}`}
                className="text-xs leading-relaxed text-gray-600 dark:text-gray-300"
              >
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {row.move}:
                </span>{' '}
                {row.notEffective ? NOT_EFFECTIVE_LABEL : row.description}
              </li>
            ),
        )}
      </ul>
    </div>
  )
}

export function DamageResults({
  attackerLabel,
  defenderLabel,
  attackerToDefender,
  defenderToAttacker,
}: DamageResultsProps) {
  return (
    <div className="space-y-8">
      <MoveTable
        title={`${attackerLabel} → ${defenderLabel}`}
        rows={attackerToDefender}
      />
      <MoveTable
        title={`${defenderLabel} → ${attackerLabel}`}
        rows={defenderToAttacker}
      />
    </div>
  )
}
