import { getChampionsSpeciesList } from '../data/championsSpecies'
import type { DexBundle, NatureEntry } from '../data/types'
import type { PokemonSet, StatsRecord } from '../types/team'
import { formatNatureLabel } from './natureLabel'
import {
  applySpeedModifiers,
  calcChampionsStats,
  createZeroStats,
  type SpeedModifiers,
} from './stats'
import { getComputedStats } from './teamStats'

export interface SpeedTierRow {
  key: string
  speciesId: string
  label: string
  baseSpe: number
  finalSpe: number
  spSpe: number
  nature: string
  natureLabel: string
  natureCase: NatureSpeedCase
  isTeam: boolean
  teamSlot: number
}

export type NatureSpeedCase = 'positive' | 'neutral' | 'negative'

export interface NatureSpeedCell {
  case: NatureSpeedCase
  natureId: string
  natureLabel: string
  baseSpe: number
  finalSpe: number
}

export interface ReferenceSpeedGridRow {
  speciesId: string
  label: string
  spSpe: number
  positive: NatureSpeedCell
  neutral: NatureSpeedCell
  negative: NatureSpeedCell
}

export type ReferenceSortKey = NatureSpeedCase | 'name'

export function getSpeNatureIds(dex: DexBundle): {
  positive: string
  negative: string
  neutral: string
} {
  let positive = 'timid'
  let negative = 'brave'
  const neutral = 'serious'

  for (const [id, n] of Object.entries(dex.natures)) {
    if (n.plus === 'spe') positive = id
    if (n.minus === 'spe') negative = id
  }

  return { positive, negative, neutral }
}

export function getNatureCaseFromId(
  natureId: string,
  dex: DexBundle,
): NatureSpeedCase {
  const entry = dex.natures[natureId]
  if (entry?.plus === 'spe') return 'positive'
  if (entry?.minus === 'spe') return 'negative'
  return 'neutral'
}

export function natureIdForCase(
  caseType: NatureSpeedCase,
  dex: DexBundle,
): string {
  const ids = getSpeNatureIds(dex)
  if (caseType === 'positive') return ids.positive
  if (caseType === 'negative') return ids.negative
  return ids.neutral
}

function natureLabel(dex: DexBundle, natureId: string): string {
  const entry = dex.natures[natureId]
  if (!entry) return natureId
  return formatNatureLabel(entry)
}

function computeSpeAtMaxSp(
  base: StatsRecord,
  nature: NatureEntry | undefined,
  spSpe: number,
): number {
  const sp = createZeroStats()
  sp.spe = spSpe

  return calcChampionsStats({
    base,
    sp,
    nature,
  }).spe
}

function buildNatureCell(
  base: StatsRecord,
  natureId: string,
  nature: NatureEntry | undefined,
  caseType: NatureSpeedCase,
  spSpe: number,
  mods: SpeedModifiers,
  dex: DexBundle,
): NatureSpeedCell {
  const baseSpe = computeSpeAtMaxSp(base, nature, spSpe)

  return {
    case: caseType,
    natureId,
    natureLabel: natureLabel(dex, natureId),
    baseSpe,
    finalSpe: applySpeedModifiers(baseSpe, mods),
  }
}

export function getBaseSpeed(set: PokemonSet, dex: DexBundle): number | null {
  return getComputedStats(set, dex)?.spe ?? null
}

export function getFinalSpeed(
  baseSpe: number,
  mods: SpeedModifiers = {},
): number {
  return applySpeedModifiers(baseSpe, mods)
}

export function buildTeamSpeedRows(
  pokemon: (PokemonSet | null)[],
  dex: DexBundle,
  mods: SpeedModifiers,
): SpeedTierRow[] {
  const rows: SpeedTierRow[] = []

  pokemon.forEach((set, slot) => {
    if (!set) return
    const row = buildTeamSpeedRow(set, slot, dex, mods)
    if (row) rows.push(row)
  })

  return rows.sort((a, b) => b.finalSpe - a.finalSpe)
}

export function buildTeamSpeedRow(
  set: PokemonSet,
  slot: number,
  dex: DexBundle,
  mods: SpeedModifiers,
): SpeedTierRow | null {
  const baseSpe = getBaseSpeed(set, dex)
  if (baseSpe === null) return null

  const natureId = set.nature
  const natureEntry = dex.natures[natureId]

  return {
    key: `team-${slot}-${set.speciesId}`,
    speciesId: set.speciesId,
    label: set.nickname?.trim() || set.speciesName,
    baseSpe,
    finalSpe: getFinalSpeed(baseSpe, mods),
    spSpe: set.evs.spe,
    nature: natureId,
    natureLabel: natureEntry ? formatNatureLabel(natureEntry) : natureId,
    natureCase: getNatureCaseFromId(natureId, dex),
    isTeam: true,
    teamSlot: slot,
  }
}

/** Default SP in Speed for the Reg M-A reference grid. */
export const REFERENCE_SP_SPE = 32

export function buildReferenceSpeedRow(
  speciesId: string,
  label: string,
  base: StatsRecord,
  spSpe: number,
  dex: DexBundle,
  mods: SpeedModifiers,
): ReferenceSpeedGridRow {
  const natureIds = getSpeNatureIds(dex)

  return {
    speciesId,
    label,
    spSpe,
    positive: buildNatureCell(
      base,
      natureIds.positive,
      dex.natures[natureIds.positive],
      'positive',
      spSpe,
      mods,
      dex,
    ),
    neutral: buildNatureCell(
      base,
      natureIds.neutral,
      dex.natures[natureIds.neutral],
      'neutral',
      spSpe,
      mods,
      dex,
    ),
    negative: buildNatureCell(
      base,
      natureIds.negative,
      dex.natures[natureIds.negative],
      'negative',
      spSpe,
      mods,
      dex,
    ),
  }
}

/** Reg M-A reference: SP Spe × positive / neutral / negative nature. */
export function buildReferenceSpeedGrid(
  dex: DexBundle,
  mods: SpeedModifiers,
  spSpe = REFERENCE_SP_SPE,
): ReferenceSpeedGridRow[] {
  const list = getChampionsSpeciesList()
  const rows: ReferenceSpeedGridRow[] = []

  for (const entry of list) {
    const species = dex.pokedex[entry.id]
    if (!species?.baseStats) continue

    rows.push(
      buildReferenceSpeedRow(
        entry.id,
        species.name,
        species.baseStats,
        spSpe,
        dex,
        mods,
      ),
    )
  }

  return rows
}

export function filterReferenceGrid(
  rows: ReferenceSpeedGridRow[],
  query: string,
  natureFilter: NatureSpeedCase | 'all',
): ReferenceSpeedGridRow[] {
  const q = query.trim().toLowerCase()

  return rows.filter((row) => {
    if (q) {
      const match =
        row.label.toLowerCase().includes(q) ||
        row.speciesId.toLowerCase().includes(q) ||
        row.positive.natureLabel.toLowerCase().includes(q) ||
        row.neutral.natureLabel.toLowerCase().includes(q) ||
        row.negative.natureLabel.toLowerCase().includes(q)
      if (!match) return false
    }

    if (natureFilter === 'all') return true

    const cell = row[natureFilter]
    return cell.baseSpe > 0
  })
}

export function sortReferenceGrid(
  rows: ReferenceSpeedGridRow[],
  sortBy: ReferenceSortKey,
): ReferenceSpeedGridRow[] {
  const sorted = [...rows]

  if (sortBy === 'name') {
    sorted.sort((a, b) => a.label.localeCompare(b.label))
    return sorted
  }

  sorted.sort((a, b) => b[sortBy].finalSpe - a[sortBy].finalSpe)
  return sorted
}

export function filterSpeedRows(
  rows: SpeedTierRow[],
  query: string,
): SpeedTierRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.speciesId.toLowerCase().includes(q),
  )
}
