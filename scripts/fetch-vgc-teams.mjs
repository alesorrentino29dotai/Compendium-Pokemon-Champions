/**
 * Downloads VGC Champions team sheet + optional pokepastes for offline autocomplete.
 * Run: npm run data:vgc-teams
 *
 * Source: https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'vgcTeams.json')
const CHAMPIONS_PATH = join(__dirname, '..', 'src', 'data', 'champions-species.json')

const SHEET_ID = '1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw'
const GID = '791705272'
const ITEM_COLS = [7, 10, 13, 16, 19, 22]

const FETCH_PASTES = !process.argv.includes('--no-pastes')
const PASTE_CONCURRENCY = 8

function toId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const ALIASES = {
  floetteeternalmega: 'floetteeternal',
  floettemega: 'floetteeternal',
  charizardmegay: 'charizard',
  charizardmegax: 'charizard',
}

function parseCSV(text) {
  const rows = []
  let row = []
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

function initResolver() {
  const ch = JSON.parse(readFileSync(CHAMPIONS_PATH, 'utf8'))
  const ids = new Set(ch.species.map((s) => s.id))
  const byName = new Map(ch.species.map((s) => [toId(s.name), s.id]))
  return { ids, byName, list: ch.species }
}

function resolveName(name, { ids, byName }) {
  const trimmed = (name || '').trim()
  if (!trimmed) return null
  const raw = toId(trimmed)
  const alias = ALIASES[raw]
  if (alias && ids.has(alias)) return alias
  if (ids.has(raw)) return raw
  const byN = byName.get(raw)
  if (byN) return byN
  for (const id of ids) {
    if (raw.includes(id) || id.includes(raw)) return id
  }
  return null
}

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function parseShowdownSet(text) {
  const lines = text
    .split('\n')
    .map((l) => stripHtml(l))
    .filter(Boolean)
  if (!lines.length) return null

  const header = lines[0]
  const atIdx = header.lastIndexOf(' @ ')
  const speciesName =
    atIdx === -1
      ? header.replace(/\s*\([MFN]\)\s*$/, '').trim()
      : header
          .slice(0, atIdx)
          .replace(/\s*\([MFN]\)\s*$/, '')
          .replace(/^(.+?)\s+\(([^)]+)\)\s*$/, '$2')
          .trim()
  const item = atIdx === -1 ? '' : header.slice(atIdx + 3).trim()

  let ability = ''
  let nature = 'serious'
  let level = 50
  const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  const moves = ['', '', '', '']
  let mi = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('Ability:')) ability = line.slice(8).trim()
    else if (line.startsWith('Level:'))
      level = Number.parseInt(line.slice(6).trim(), 10) || 50
    else if (/^EVs:/i.test(line) || /^SP:/i.test(line)) {
      const body = line.replace(/^EVs:\s*/i, '').replace(/^SP:\s*/i, '')
      for (const part of body.split('/')) {
        const m = part.trim().match(/^(\d+)\s+(\w+)/i)
        if (!m) continue
        const stat = m[2].toLowerCase()
        if (stat in evs) evs[stat] = Number.parseInt(m[1], 10)
      }
    } else if (line.endsWith(' Nature')) {
      nature = line.replace(/\s+Nature$/i, '').trim().toLowerCase()
    } else if (line.startsWith('-') && mi < 4) {
      moves[mi++] = line.replace(/^-\s*/, '').trim()
    }
  }

  return { speciesName, item, ability, nature, level, evs, moves }
}

function extractBlocks(html) {
  const blocks = []
  const re = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const t = stripHtml(m[1])
    if (t) blocks.push(t)
  }
  return blocks
}

async function fetchPaste(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Compendium-Pokemon-Champions/0.1' },
    })
    if (!res.ok) return null
    const html = await res.text()
    return extractBlocks(html).map(parseShowdownSet).filter(Boolean)
  } catch {
    return null
  }
}

async function mapPool(items, fn, concurrency) {
  const results = []
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  )
  return results
}

function aggregateSpeciesStats(teams, resolver) {
  const appearances = new Map()
  const teammatePairs = new Map()
  const itemCounts = new Map()
  const buildCounts = new Map()

  for (const team of teams) {
    const ids = team.speciesIds
    for (const id of ids) {
      appearances.set(id, (appearances.get(id) ?? 0) + 1)
    }
    for (let a = 0; a < ids.length; a++) {
      for (let b = 0; b < ids.length; b++) {
        if (a === b) continue
        const key = `${ids[a]}|${ids[b]}`
        teammatePairs.set(key, (teammatePairs.get(key) ?? 0) + 1)
      }
    }
    team.sets?.forEach((set, slot) => {
      const id = ids[slot]
      if (!id || !set) return
      if (set.item) {
        const ik = `${id}|${set.item}`
        itemCounts.set(ik, (itemCounts.get(ik) ?? 0) + 1)
      }
      const bk = `${id}|${set.ability}|${set.item}|${set.moves.join(',')}`
      buildCounts.set(bk, (buildCounts.get(bk) ?? 0) + 1)
    })
  }

  const speciesStats = {}
  for (const [speciesId, count] of appearances) {
    const teammates = []
    for (const [key, n] of teammatePairs) {
      const [from, to] = key.split('|')
      if (from !== speciesId) continue
      teammates.push({ speciesId: to, count: n, pct: Math.round((n / count) * 1000) / 10 })
    }
    teammates.sort((a, b) => b.count - a.count)

    const items = []
    for (const [key, n] of itemCounts) {
      const [sid, item] = key.split('|')
      if (sid !== speciesId) continue
      items.push({ item, count: n, pct: Math.round((n / count) * 1000) / 10 })
    }
    items.sort((a, b) => b.count - a.count)

    const builds = []
    for (const [key, n] of buildCounts) {
      const [sid, ability, item, moveStr] = key.split('|')
      if (sid !== speciesId) continue
      builds.push({
        ability,
        item,
        moves: moveStr.split(',').filter(Boolean),
        count: n,
        pct: Math.round((n / count) * 1000) / 10,
      })
    }
    builds.sort((a, b) => b.count - a.count)

    speciesStats[speciesId] = {
      appearances: count,
      teammates: teammates.slice(0, 12),
      items: items.slice(0, 8),
      builds: builds.slice(0, 8),
    }
  }

  return speciesStats
}

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`
  console.log('Fetching sheet…', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  const csv = await res.text()

  const rows = parseCSV(csv)
  const hdr = rows.find((r) => r[0] === 'Team ID')
  if (!hdr) throw new Error('Header row not found')
  const cpIdx = hdr.indexOf('Pokemon Text for Copypasta')
  const pasteIdx = hdr.indexOf('Pokepaste')
  const dataRows = rows
    .slice(rows.indexOf(hdr) + 1)
    .filter((r) => r[0]?.startsWith('PC'))

  const resolver = initResolver()
  const teams = []

  for (const row of dataRows) {
    const names = []
    const speciesIds = []
    for (let i = 0; i < 6; i++) {
      const name = row[cpIdx + i]?.trim() ?? ''
      names.push(name)
      speciesIds.push(resolveName(name, resolver))
    }
    if (speciesIds.some((id) => !id)) continue

    const items = ITEM_COLS.map((col) => row[col]?.trim() ?? '')
    const pokepaste = row[pasteIdx]?.trim() || undefined

    teams.push({
      id: row[0],
      description: row[1] || undefined,
      speciesIds,
      names,
      items,
      pokepaste,
    })
  }

  console.log(`Parsed ${teams.length} teams from sheet`)

  if (FETCH_PASTES) {
    const withPaste = teams.filter((t) => t.pokepaste?.includes('pokepast'))
    console.log(`Fetching ${withPaste.length} pokepastes…`)
    let done = 0
    await mapPool(
      withPaste,
      async (team) => {
        const sets = await fetchPaste(team.pokepaste)
        if (sets?.length) {
          team.sets = sets.map((s) => ({
            speciesName: s.speciesName,
            item: s.item,
            ability: s.ability,
            nature: s.nature,
            level: s.level,
            evs: s.evs,
            moves: s.moves,
          }))
        }
        done++
        if (done % 50 === 0) console.log(`  ${done}/${withPaste.length}`)
      },
      PASTE_CONCURRENCY,
    )
  }

  const speciesStats = aggregateSpeciesStats(teams, resolver)

  const out = {
    source: 'VGCPastes Repository (Champions M-A)',
    sheetId: SHEET_ID,
    gid: GID,
    exportedAt: new Date().toISOString(),
    teamCount: teams.length,
    teams: teams.map(({ sets, ...t }) => ({
      ...t,
      sets: sets?.length ? sets : undefined,
    })),
    speciesStats,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(out))
  console.log('Wrote', OUT_PATH, `(${Math.round(JSON.stringify(out).length / 1024)} KB)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
