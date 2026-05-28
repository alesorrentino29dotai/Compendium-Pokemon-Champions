import type { NatureEntry, StatName } from '../data/types'

export const STAT_ABBREV: Record<StatName, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

export function formatNatureLabel(nature: NatureEntry): string {
  if (!nature.plus || !nature.minus) {
    return nature.name
  }

  return `${nature.name} (+${STAT_ABBREV[nature.plus]}, -${STAT_ABBREV[nature.minus]})`
}
