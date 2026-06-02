import type { PokemonSet, StatsRecord, Team } from '../types/team'

function nonEmpty(value: string | undefined | null): value is string {
  return Boolean(value && value.trim())
}

function formatSpLine(sp: StatsRecord): string {
  // Showdown expects "EVs: 0 HP / 0 Atk / ..."
  const parts: string[] = []
  if (sp.hp) parts.push(`${sp.hp} HP`)
  if (sp.atk) parts.push(`${sp.atk} Atk`)
  if (sp.def) parts.push(`${sp.def} Def`)
  if (sp.spa) parts.push(`${sp.spa} SpA`)
  if (sp.spd) parts.push(`${sp.spd} SpD`)
  if (sp.spe) parts.push(`${sp.spe} Spe`)
  return parts.length ? `EVs: ${parts.join(' / ')}` : ''
}

function formatChampionsSpLine(sp: StatsRecord): string {
  const parts: string[] = []
  if (sp.hp) parts.push(`${sp.hp} HP`)
  if (sp.atk) parts.push(`${sp.atk} Atk`)
  if (sp.def) parts.push(`${sp.def} Def`)
  if (sp.spa) parts.push(`${sp.spa} SpA`)
  if (sp.spd) parts.push(`${sp.spd} SpD`)
  if (sp.spe) parts.push(`${sp.spe} Spe`)
  return parts.length ? `SP: ${parts.join(' / ')}` : 'SP: 0'
}

function headerLine(set: PokemonSet): string {
  const name = nonEmpty(set.nickname) ? `${set.nickname} (${set.speciesName})` : set.speciesName
  return nonEmpty(set.item) ? `${name} @ ${set.item}` : name
}

function exportSetShowdown(set: PokemonSet): string {
  const lines: string[] = []
  lines.push(headerLine(set))
  if (nonEmpty(set.ability)) lines.push(`Ability: ${set.ability}`)
  if (set.level) lines.push(`Level: ${set.level}`)
  if (nonEmpty(set.teraType)) lines.push(`Tera Type: ${set.teraType}`)
  if (nonEmpty(set.nature)) lines.push(`${set.nature} Nature`)

  const evLine = formatSpLine(set.evs)
  if (evLine) lines.push(evLine)

  for (const m of set.moves) {
    if (nonEmpty(m)) lines.push(`- ${m}`)
  }
  return lines.join('\n')
}

function exportSetChampions(set: PokemonSet): string {
  const lines: string[] = []
  lines.push(headerLine(set))
  if (nonEmpty(set.ability)) lines.push(`Ability: ${set.ability}`)
  if (set.level) lines.push(`Level: ${set.level}`)
  if (nonEmpty(set.teraType)) lines.push(`Tera Type: ${set.teraType}`)
  if (nonEmpty(set.nature)) lines.push(`${set.nature} Nature`)

  lines.push(formatChampionsSpLine(set.evs))

  for (const m of set.moves) {
    if (nonEmpty(m)) lines.push(`- ${m}`)
  }
  return lines.join('\n')
}

export function exportTeamShowdown(team: Team): string {
  return team.pokemon
    .filter((p): p is PokemonSet => Boolean(p))
    .map(exportSetShowdown)
    .join('\n\n')
    .trim()
}

export function exportTeamChampions(team: Team): string {
  return team.pokemon
    .filter((p): p is PokemonSet => Boolean(p))
    .map(exportSetChampions)
    .join('\n\n')
    .trim()
}

