/**
 * Builds pokemonZoneMeta.json from vgcTeams species stats (offline fallback).
 * When CI can reach pokemon-zone.com, fetch-pokemon-zone.mjs may enrich this file.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VGC_PATH = join(__dirname, '..', 'src', 'data', 'vgcTeams.json')
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'pokemonZoneMeta.json')

const vgc = JSON.parse(readFileSync(VGC_PATH, 'utf8'))
const species = {}

for (const [id, stats] of Object.entries(vgc.speciesStats ?? {})) {
  species[id] = {
    appearances: stats.appearances,
    teammates: stats.teammates,
    items: stats.items,
    builds: stats.builds,
  }
}

const out = {
  exportedAt: vgc.exportedAt ?? new Date().toISOString(),
  source: 'VGCPastes-derived (bundled offline fallback)',
  species,
}

writeFileSync(OUT_PATH, JSON.stringify(out))
console.log('Wrote', OUT_PATH, Object.keys(species).length, 'species')
