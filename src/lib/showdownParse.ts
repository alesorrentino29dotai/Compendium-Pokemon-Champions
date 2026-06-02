import type { StatName } from '../data/types'
import type { PokemonSet, StatsRecord } from '../types/team'
import { createMaxIvs, createZeroStats } from './stats'
import { toId } from './toId'
import { resolveVgcSpeciesName } from './vgcTeamNames'

const STAT_LABELS: Record<string, StatName> = {
  hp: 'hp',
  atk: 'atk',
  def: 'def',
  spa: 'spa',
  spd: 'spd',
  spe: 'spe',
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/** Extract plain Showdown blocks from pokepast.es HTML. */
export function extractShowdownBlocksFromHtml(html: string): string[] {
  const blocks: string[] = []
  const re = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1])
    if (text) blocks.push(text)
  }
  return blocks
}

function parseSpLine(line: string): StatsRecord {
  const sp = createZeroStats()
  const body = line.replace(/^EVs:\s*/i, '').replace(/^SP:\s*/i, '')
  const parts = body.split('/').map((p) => p.trim())
  for (const part of parts) {
    const match = part.match(/^(\d+)\s+(\w+)/i)
    if (!match) continue
    const value = Number.parseInt(match[1], 10)
    const key = STAT_LABELS[match[2].toLowerCase()]
    if (key) sp[key] = value
  }
  return sp
}

function parseHeader(line: string): {
  speciesName: string
  nickname?: string
  item: string
  gender?: PokemonSet['gender']
} {
  let rest = line.trim()
  let gender: PokemonSet['gender'] | undefined

  const genderMatch = rest.match(/\(([MFN])\)\s*$/)
  if (genderMatch) {
    gender = genderMatch[1] as PokemonSet['gender']
    rest = rest.replace(/\s*\([MFN]\)\s*$/, '').trim()
  }

  const atIdx = rest.lastIndexOf(' @ ')
  if (atIdx === -1) {
    return parseSpeciesOnly(rest, gender)
  }

  const left = rest.slice(0, atIdx).trim()
  const item = rest.slice(atIdx + 3).trim()
  const species = parseSpeciesOnly(left, gender)
  return { ...species, item }
}

function parseSpeciesOnly(
  text: string,
  gender?: PokemonSet['gender'],
): {
  speciesName: string
  nickname?: string
  item: string
  gender?: PokemonSet['gender']
} {
  const nickMatch = text.match(/^(.+?)\s+\(([^)]+)\)\s*$/)
  if (nickMatch) {
    return {
      nickname: nickMatch[1].trim(),
      speciesName: nickMatch[2].trim(),
      item: '',
      gender,
    }
  }
  return { speciesName: text, item: '', gender }
}

export interface ParsedShowdownSet {
  speciesName: string
  speciesId: string | null
  nickname?: string
  item: string
  ability: string
  nature: string
  level: number
  evs: StatsRecord
  moves: [string, string, string, string]
  gender?: PokemonSet['gender']
  teraType?: string
}

export function parseShowdownSet(text: string): ParsedShowdownSet | null {
  const lines = text
    .split('\n')
    .map((l) => stripHtml(l))
    .filter((l) => l.length > 0)

  if (lines.length === 0) return null

  const header = parseHeader(lines[0])
  let ability = ''
  let level = 50
  let nature = 'serious'
  let evs = createZeroStats()
  let teraType: string | undefined
  const moves: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('Ability:')) {
      ability = line.slice('Ability:'.length).trim()
    } else if (line.startsWith('Level:')) {
      level = Number.parseInt(line.slice('Level:'.length).trim(), 10) || 50
    } else if (line.startsWith('Tera Type:')) {
      teraType = line.slice('Tera Type:'.length).trim()
    } else if (/^EVs:/i.test(line) || /^SP:/i.test(line)) {
      evs = parseSpLine(line)
    } else if (line.endsWith(' Nature')) {
      nature = line.replace(/\s+Nature$/i, '').trim().toLowerCase()
    } else if (line.startsWith('-')) {
      moves.push(line.replace(/^-\s*/, '').trim())
    }
  }

  const speciesId = resolveVgcSpeciesName(header.speciesName)

  return {
    speciesName: header.speciesName,
    speciesId,
    nickname: header.nickname,
    item: header.item,
    ability,
    nature,
    level,
    evs,
    moves: [
      moves[0] ?? '',
      moves[1] ?? '',
      moves[2] ?? '',
      moves[3] ?? '',
    ] as ParsedShowdownSet['moves'],
    gender: header.gender,
    teraType,
  }
}

export function parsedToPokemonSet(
  parsed: ParsedShowdownSet,
  fallbackSpeciesId: string,
  fallbackSpeciesName: string,
): PokemonSet | null {
  const speciesId = parsed.speciesId ?? fallbackSpeciesId
  if (!speciesId) return null

  return {
    speciesId,
    speciesName: parsed.speciesName || fallbackSpeciesName,
    nickname: parsed.nickname,
    item: parsed.item,
    ability: parsed.ability,
    nature: parsed.nature,
    level: parsed.level,
    evs: parsed.evs,
    ivs: createMaxIvs(),
    moves: parsed.moves,
    gender: parsed.gender,
    teraType: parsed.teraType,
  }
}

export function parseShowdownTeam(text: string): ParsedShowdownSet[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => parseShowdownSet(block.trim()))
    .filter((s): s is ParsedShowdownSet => s !== null)
}

export function speciesIdFromParsed(parsed: ParsedShowdownSet): string | null {
  return parsed.speciesId ?? resolveVgcSpeciesName(parsed.speciesName)
}

export function normalizeItemName(item: string, dexItems: Record<string, { name: string }>): string {
  if (!item) return ''
  const id = toId(item)
  if (dexItems[id]?.name) return dexItems[id].name
  for (const entry of Object.values(dexItems)) {
    if (toId(entry.name) === id) return entry.name
  }
  return item
}
