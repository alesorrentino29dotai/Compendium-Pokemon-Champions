/**
 * Downloads Showdown-compatible JSON for offline PWA use.
 * Run: npm run data:fetch
 *
 * - pokedex, moves, learnsets: play.pokemonshowdown.com/data/*.json
 * - items, abilities, natures, typechart: exported from @pkmn/dex (same source)
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Dex } = require('@pkmn/dex')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'raw')

const CDN_BASE = 'https://play.pokemonshowdown.com/data'

const CDN_JSON_FILES = ['pokedex.json', 'moves.json', 'learnsets.json']

/** Tables to dump from @pkmn/dex (keys match Showdown JSON naming). */
const DEX_EXPORTS = [
  ['items', 'Items'],
  ['abilities', 'Abilities'],
  ['natures', 'Natures'],
  ['typechart', 'Types'],
]

async function fetchJson(filename) {
  const url = `${CDN_BASE}/${filename}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

function exportDexTable(tableName) {
  const raw = Dex.data[tableName]
  if (!raw) throw new Error(`Dex.data.${tableName} missing`)
  return raw
}

async function writeJson(filename, data) {
  const outName = filename.endsWith('.json') ? filename : `${filename}.json`
  const outPath = join(OUT_DIR, outName)
  await writeFile(outPath, JSON.stringify(data))
  const keys = Array.isArray(data) ? data.length : Object.keys(data).length
  return { outPath, keys }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Writing Showdown data to ${OUT_DIR}\n`)

  for (const file of CDN_JSON_FILES) {
    process.stdout.write(`  ${file} (CDN) ... `)
    const data = await fetchJson(file)
    const { keys } = await writeJson(file, data)
    console.log(`ok (${keys} entries)`)
  }

  for (const [filename, table] of DEX_EXPORTS) {
    process.stdout.write(`  ${filename} (@pkmn/dex) ... `)
    const data = exportDexTable(table)
    const { keys } = await writeJson(filename, data)
    console.log(`ok (${keys} entries)`)
  }

  const meta = {
    fetchedAt: new Date().toISOString(),
    cdn: CDN_BASE,
    dexPackage: '@pkmn/dex',
    files: [
      ...CDN_JSON_FILES,
      ...DEX_EXPORTS.map(([f]) => f),
    ],
  }
  await writeFile(join(OUT_DIR, '_meta.json'), JSON.stringify(meta, null, 2))
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
