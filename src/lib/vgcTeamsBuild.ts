/**
 * Build VGC team bundle from spreadsheet CSV (browser-safe, no pokepaste fetch).
 */

import championsSpecies from '../data/champions-species.json'
import { initChampionsSpeciesIndex, resolveVgcSpeciesName } from './vgcTeamNames'
import type {
  VgcBuildRow,
  VgcSpeciesStats,
  VgcTeamRecord,
  VgcTeamsBundle,
} from './vgcTeams'

const SHEET_ID = '1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw'
const GID = '791705272'
const ITEM_COLS = [7, 10, 13, 16, 19, 22]

initChampionsSpeciesIndex(championsSpecies.species)

export const VGC_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQ = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const n = text[i + 1]
    if (inQ) {
      if (c === '"' && n === '"') {
        cur += '"'
        i++
      } else if (c === '"') inQ = false
      else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && n === '\n') i++
      row.push(cur)
      cur = ''
      if (row.some((x) => x)) rows.push(row)
      row = []
    } else cur += c
  }
  if (cur || row.length) {
    row.push(cur)
    if (row.some((x) => x)) rows.push(row)
  }
  return rows
}

function aggregateSpeciesStats(
  teams: VgcTeamRecord[],
): Record<string, VgcSpeciesStats> {
  const appearances = new Map<string, number>()
  const teammatePairs = new Map<string, number>()
  const itemCounts = new Map<string, number>()

  for (const team of teams) {
    for (const id of team.speciesIds) {
      appearances.set(id, (appearances.get(id) ?? 0) + 1)
    }
    for (let a = 0; a < team.speciesIds.length; a++) {
      for (let b = 0; b < team.speciesIds.length; b++) {
        if (a === b) continue
        const key = `${team.speciesIds[a]}|${team.speciesIds[b]}`
        teammatePairs.set(key, (teammatePairs.get(key) ?? 0) + 1)
      }
    }
    team.speciesIds.forEach((id, slot) => {
      const item = team.items[slot]
      if (item) {
        const ik = `${id}|${item}`
        itemCounts.set(ik, (itemCounts.get(ik) ?? 0) + 1)
      }
    })
  }

  const speciesStats: Record<string, VgcSpeciesStats> = {}

  for (const [speciesId, count] of appearances) {
    const teammates = []
    for (const [key, n] of teammatePairs) {
      const [from, to] = key.split('|')
      if (from !== speciesId) continue
      teammates.push({
        speciesId: to,
        count: n,
        pct: Math.round((n / count) * 1000) / 10,
      })
    }
    teammates.sort((a, b) => b.count - a.count)

    const items = []
    for (const [key, n] of itemCounts) {
      const [sid, item] = key.split('|')
      if (sid !== speciesId) continue
      items.push({ item, count: n, pct: Math.round((n / count) * 1000) / 10 })
    }
    items.sort((a, b) => b.count - a.count)

    speciesStats[speciesId] = {
      appearances: count,
      teammates: teammates.slice(0, 12),
      items: items.slice(0, 8),
      builds: [] as VgcBuildRow[],
    }
  }

  return speciesStats
}

/** Merge pokepaste builds from an older bundle into a CSV-only refresh. */
export function mergeVgcBundles(
  fresh: VgcTeamsBundle,
  previous: VgcTeamsBundle | null,
): VgcTeamsBundle {
  if (!previous) return fresh

  const prevById = new Map(previous.teams.map((t) => [t.id, t]))
  const teams = fresh.teams.map((t) => {
    const old = prevById.get(t.id)
    if (!old?.sets?.length) return t
    if (t.pokepaste && old.pokepaste === t.pokepaste) {
      return { ...t, sets: old.sets }
    }
    return t
  })

  const speciesStats = aggregateSpeciesStats(teams)
  for (const [id, stats] of Object.entries(previous.speciesStats)) {
    if (stats.builds?.length && speciesStats[id]) {
      speciesStats[id] = { ...speciesStats[id], builds: stats.builds }
    }
  }

  return {
    ...fresh,
    teams,
    speciesStats,
  }
}

export function buildVgcBundleFromCsv(
  csv: string,
  source = 'VGCPastes Repository (Champions M-A)',
): VgcTeamsBundle | null {
  const rows = parseCsv(csv)
  const hdr = rows.find((r) => r[0] === 'Team ID')
  if (!hdr) return null

  const cpIdx = hdr.indexOf('Pokemon Text for Copypasta')
  const pasteIdx = hdr.indexOf('Pokepaste')
  const dataRows = rows
    .slice(rows.indexOf(hdr) + 1)
    .filter((r) => r[0]?.startsWith('PC'))

  const teams: VgcTeamRecord[] = []

  for (const row of dataRows) {
    const names: string[] = []
    const speciesIds: string[] = []
    for (let i = 0; i < 6; i++) {
      const name = row[cpIdx + i]?.trim() ?? ''
      names.push(name)
      const id = resolveVgcSpeciesName(name)
      speciesIds.push(id ?? '')
    }
    if (speciesIds.some((id) => !id)) continue

    teams.push({
      id: row[0],
      description: row[1] || undefined,
      speciesIds: speciesIds as string[],
      names,
      items: ITEM_COLS.map((col) => row[col]?.trim() ?? ''),
      pokepaste: row[pasteIdx]?.trim() || undefined,
    })
  }

  return {
    source,
    exportedAt: new Date().toISOString(),
    teamCount: teams.length,
    teams,
    speciesStats: aggregateSpeciesStats(teams),
  }
}
