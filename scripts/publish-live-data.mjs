/**
 * Copies built data into public/data/live for deployed weekly updates.
 * Run after: npm run data:vgc-teams && node scripts/build-pokemon-zone-meta.mjs
 */

import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LIVE_DIR = join(ROOT, 'public', 'data', 'live')
const VGC_SRC = join(ROOT, 'src', 'data', 'vgcTeams.json')
const PZ_SRC = join(ROOT, 'src', 'data', 'pokemonZoneMeta.json')

mkdirSync(LIVE_DIR, { recursive: true })

copyFileSync(VGC_SRC, join(LIVE_DIR, 'vgcTeams.json'))
copyFileSync(PZ_SRC, join(LIVE_DIR, 'pokemonZoneMeta.json'))

const vgc = JSON.parse(readFileSync(VGC_SRC, 'utf8'))
const version = vgc.exportedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

const manifest = {
  version,
  exportedAt: vgc.exportedAt ?? new Date().toISOString(),
  vgcTeamsUrl: 'vgcTeams.json',
  pokemonZoneMetaUrl: 'pokemonZoneMeta.json',
}

writeFileSync(join(LIVE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Published live data manifest version', version)
