import championsSpecies from '../data/champions-species.json'
import vgcTeamsJson from '../data/vgcTeams.json'
import type { PokemonSet } from '../types/team'
import { createPokemonSetFromName, defaultAbility } from './pokemonSet'
import { loadDex } from '../data/loadDex'
import { createMaxIvs, createZeroStats } from './stats'
import { normalizeItemName, parsedToPokemonSet, parseShowdownSet } from './showdownParse'
import { initChampionsSpeciesIndex, resolveVgcSpeciesName } from './vgcTeamNames'

initChampionsSpeciesIndex(championsSpecies.species)

export interface VgcTeamSet {
  speciesName: string
  item: string
  ability: string
  nature: string
  level: number
  evs: PokemonSet['evs']
  moves: string[]
}

export interface VgcTeamRecord {
  id: string
  description?: string
  speciesIds: string[]
  names: string[]
  items: string[]
  pokepaste?: string
  sets?: VgcTeamSet[]
}

export interface VgcUsageRow {
  count: number
  pct: number
}

export interface VgcTeammateRow extends VgcUsageRow {
  speciesId: string
}

export interface VgcItemRow extends VgcUsageRow {
  item: string
}

export interface VgcBuildRow extends VgcUsageRow {
  ability: string
  item: string
  moves: string[]
}

export interface VgcSpeciesStats {
  appearances: number
  teammates: VgcTeammateRow[]
  items: VgcItemRow[]
  builds: VgcBuildRow[]
}

export interface VgcTeamsBundle {
  source: string
  exportedAt: string
  teamCount: number
  teams: VgcTeamRecord[]
  speciesStats: Record<string, VgcSpeciesStats>
}

const bundle = vgcTeamsJson as VgcTeamsBundle

export function getVgcTeamsBundle(): VgcTeamsBundle {
  return bundle
}

export function getVgcSpeciesStats(speciesId: string): VgcSpeciesStats | null {
  return bundle.speciesStats[speciesId] ?? null
}

export function pokemonZoneUrl(speciesId: string): string {
  return `https://www.pokemon-zone.com/champions/pokemon/${speciesId}/`
}

function vgcSetToPokemonSet(
  teamSet: VgcTeamSet,
  speciesId: string,
): PokemonSet | null {
  const dex = loadDex()
  const species = dex.pokedex[speciesId]
  if (!species) return null

  const parsed = parseShowdownSet(
    [
      teamSet.item
        ? `${teamSet.speciesName} @ ${teamSet.item}`
        : teamSet.speciesName,
      teamSet.ability ? `Ability: ${teamSet.ability}` : '',
      `Level: ${teamSet.level}`,
      `EVs: ${Object.entries(teamSet.evs)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${v} ${k === 'spa' ? 'SpA' : k === 'spd' ? 'SpD' : k === 'spe' ? 'Spe' : k.charAt(0).toUpperCase() + k.slice(1)}`)
        .join(' / ')}`,
      `${teamSet.nature} Nature`,
      ...teamSet.moves.filter(Boolean).map((m) => `- ${m}`),
    ]
      .filter(Boolean)
      .join('\n'),
  )

  if (!parsed) {
    return {
      speciesId,
      speciesName: species.name,
      item: normalizeItemName(teamSet.item, dex.items),
      ability: teamSet.ability || defaultAbility(species),
      nature: teamSet.nature || 'serious',
      level: teamSet.level,
      evs: teamSet.evs,
      ivs: createMaxIvs(),
      moves: [
        teamSet.moves[0] ?? '',
        teamSet.moves[1] ?? '',
        teamSet.moves[2] ?? '',
        teamSet.moves[3] ?? '',
      ] as PokemonSet['moves'],
    }
  }

  return (
    parsedToPokemonSet(parsed, speciesId, species.name) ?? {
      speciesId,
      speciesName: species.name,
      item: teamSet.item,
      ability: teamSet.ability,
      nature: teamSet.nature,
      level: teamSet.level,
      evs: teamSet.evs,
      ivs: createMaxIvs(),
      moves: [
        teamSet.moves[0] ?? '',
        teamSet.moves[1] ?? '',
        teamSet.moves[2] ?? '',
        teamSet.moves[3] ?? '',
      ] as PokemonSet['moves'],
    }
  )
}

export function buildSetFromVgcTeam(
  record: VgcTeamRecord,
  speciesId: string,
  _slotIndex: number,
): PokemonSet | null {
  const dex = loadDex()
  const species = dex.pokedex[speciesId]
  if (!species) return null

  const idx = record.speciesIds.indexOf(speciesId)
  if (idx === -1) return null

  const teamSet = record.sets?.[idx]
  if (teamSet) {
    const set = vgcSetToPokemonSet(teamSet, speciesId)
    if (set) return set
  }

  if (record.id.startsWith('guest-')) {
    return buildSetFromSpeciesMeta(speciesId)
  }

  const metaSet = buildSetFromSpeciesMeta(speciesId)
  const base = createPokemonSetFromName(species.name, dex)
  if (!base) return metaSet

  const sheetItem = record.items[idx]
  if (sheetItem) {
    base.item = normalizeItemName(sheetItem, dex.items)
  }

  return metaSet ?? base
}

export type TeamSuggestionKind = 'exact' | 'partial' | 'guest'

export interface TeamCompleteSuggestion {
  kind: TeamSuggestionKind
  team: VgcTeamRecord
  score: number
  matchedSpecies: string[]
  missingSpecies: string[]
  /** How many of the user's picks appear on this suggestion. */
  overlapCount: number
}

/** @deprecated Use findTeamCompleteSuggestions */
export type TeamMatchSuggestion = TeamCompleteSuggestion

export function buildSetFromSpeciesMeta(speciesId: string): PokemonSet | null {
  const dex = loadDex()
  const species = dex.pokedex[speciesId]
  if (!species) return null

  const base = createPokemonSetFromName(species.name, dex)
  if (!base) return null

  const meta = getVgcSpeciesStats(speciesId)
  const build = meta?.builds[0]
  if (!build) return base

  base.ability = build.ability || base.ability
  if (build.item) base.item = normalizeItemName(build.item, dex.items)
  if (build.moves.length) {
    base.moves = [
      build.moves[0] ?? '',
      build.moves[1] ?? '',
      build.moves[2] ?? '',
      build.moves[3] ?? '',
    ] as PokemonSet['moves']
  }
  return base
}

function aggregateTeammateScores(
  selectedIds: string[],
  exclude: Set<string>,
): { speciesId: string; score: number }[] {
  const scores = new Map<string, number>()

  for (const id of selectedIds) {
    const stats = getVgcSpeciesStats(id)
    if (!stats) continue
    for (const row of stats.teammates) {
      if (exclude.has(row.speciesId)) continue
      scores.set(row.speciesId, (scores.get(row.speciesId) ?? 0) + row.count)
    }
  }

  return [...scores.entries()]
    .map(([speciesId, score]) => ({ speciesId, score }))
    .sort((a, b) => b.score - a.score || a.speciesId.localeCompare(b.speciesId))
}

function syntheticGuestTeam(
  speciesIds: string[],
  label: string,
  id: string,
): VgcTeamRecord {
  return {
    id,
    description: label,
    speciesIds: speciesIds.slice(0, 6),
    names: speciesIds.map(getSpeciesName),
    items: Array(6).fill(''),
  }
}

function buildGuestSuggestions(
  selected: string[],
  limit: number,
): TeamCompleteSuggestion[] {
  const selectedSet = new Set(selected)
  const need = 6 - selected.length
  if (need <= 0) return []

  const ranked = aggregateTeammateScores(selected, selectedSet)
  const suggestions: TeamCompleteSuggestion[] = []

  const primaryFill = ranked.slice(0, need).map((r) => r.speciesId)
  if (primaryFill.length === need) {
    const speciesIds = [...selected, ...primaryFill]
    suggestions.push({
      kind: 'guest',
      team: syntheticGuestTeam(
        speciesIds,
        'Suggested from most common teammates in VGCPastes',
        'guest-top-teammates',
      ),
      score: 50 + primaryFill.reduce((sum, id, i) => {
        const row = ranked.find((r) => r.speciesId === id)
        return sum + (row?.score ?? 0) / (i + 1)
      }, 0),
      matchedSpecies: [...selected],
      missingSpecies: primaryFill,
      overlapCount: selected.length,
    })
  }

  if (limit > 1 && ranked.length > need) {
    const altFill = [
      ...ranked.slice(0, need - 1).map((r) => r.speciesId),
      ranked[need]?.speciesId,
    ].filter(Boolean)
    if (altFill.length === need && altFill.join() !== primaryFill.join()) {
      suggestions.push({
        kind: 'guest',
        team: syntheticGuestTeam(
          [...selected, ...altFill],
          'Alternative teammate mix (2nd-choice options)',
          'guest-alt-teammates',
        ),
        score: 40,
        matchedSpecies: [...selected],
        missingSpecies: altFill,
        overlapCount: selected.length,
      })
    }
  }

  return suggestions.slice(0, limit)
}

export function findMatchingVgcTeams(
  selectedSpeciesIds: string[],
  limit = 8,
): TeamCompleteSuggestion[] {
  return findTeamCompleteSuggestions(selectedSpeciesIds).filter(
    (s) => s.kind === 'exact',
  ).slice(0, limit)
}

export function findTeamCompleteSuggestions(
  selectedSpeciesIds: string[],
  options: {
    exactLimit?: number
    partialLimit?: number
    guestLimit?: number
  } = {},
): TeamCompleteSuggestion[] {
  const selected = [...new Set(selectedSpeciesIds.filter(Boolean))]
  if (selected.length < 1) return []

  const {
    exactLimit = 6,
    partialLimit = 5,
    guestLimit = 2,
  } = options

  const minOverlap = Math.min(2, selected.length)
  const exact: TeamCompleteSuggestion[] = []
  const partial: TeamCompleteSuggestion[] = []

  for (const team of bundle.teams) {
    const teamSet = new Set(team.speciesIds)
    const overlap = selected.filter((id) => teamSet.has(id))
    const overlapCount = overlap.length
    if (overlapCount < minOverlap) continue

    const missingFromTeam = team.speciesIds.filter((id) => !selected.includes(id))
    const missingFromSelection = selected.filter((id) => !teamSet.has(id))
    const isExact = missingFromSelection.length === 0

    const entry: TeamCompleteSuggestion = {
      kind: isExact ? 'exact' : 'partial',
      team,
      score:
        overlapCount * 100 -
        missingFromSelection.length * 40 +
        (isExact ? 500 : 0),
      matchedSpecies: overlap,
      missingSpecies: isExact ? missingFromTeam : [...missingFromTeam],
      overlapCount,
    }

    if (isExact) exact.push(entry)
    else partial.push(entry)
  }

  exact.sort((a, b) => b.score - a.score || a.team.id.localeCompare(b.team.id))
  partial.sort((a, b) => b.score - a.score || a.team.id.localeCompare(b.team.id))

  const guests = buildGuestSuggestions(selected, guestLimit)

  return [
    ...exact.slice(0, exactLimit),
    ...partial.slice(0, partialLimit),
    ...guests,
  ]
}

export function applyVgcTeamToSlots(
  record: VgcTeamRecord,
  currentSlots: (PokemonSet | null)[],
): (PokemonSet | null)[] {
  const next: (PokemonSet | null)[] = [...currentSlots]
  const usedTeamSlots = new Set<number>()

  for (let userSlot = 0; userSlot < 6; userSlot++) {
    const existing = currentSlots[userSlot]
    if (!existing) continue

    const teamIdx = record.speciesIds.indexOf(existing.speciesId)
    if (teamIdx === -1) continue

    usedTeamSlots.add(teamIdx)
    const built = buildSetFromVgcTeam(record, existing.speciesId, teamIdx)
    if (built) next[userSlot] = built
  }

  const emptySlots = next
    .map((p, i) => (p ? -1 : i))
    .filter((i) => i >= 0)

  const remainingSpecies = record.speciesIds.filter(
    (_, idx) => !usedTeamSlots.has(idx),
  )

  for (let i = 0; i < emptySlots.length && i < remainingSpecies.length; i++) {
    const speciesId = remainingSpecies[i]
    const teamIdx = record.speciesIds.indexOf(speciesId)
    const built =
      buildSetFromVgcTeam(record, speciesId, teamIdx) ??
      buildSetFromSpeciesMeta(speciesId)
    if (built) next[emptySlots[i]] = built
  }

  return next
}

export function getSpeciesName(speciesId: string): string {
  const entry = championsSpecies.species.find((s) => s.id === speciesId)
  return entry?.name ?? speciesId
}

/** Fallback when vgcTeams.json is missing builds — sheet item only. */
export function applySheetItem(
  set: PokemonSet,
  itemLabel: string,
): PokemonSet {
  const dex = loadDex()
  return {
    ...set,
    item: normalizeItemName(itemLabel, dex.items),
  }
}

export function resolveSpeciesLabel(label: string): string | null {
  return resolveVgcSpeciesName(label)
}

export function emptyStats(): PokemonSet['evs'] {
  return createZeroStats()
}
