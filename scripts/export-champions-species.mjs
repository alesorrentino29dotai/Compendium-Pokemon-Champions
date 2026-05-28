/**
 * Exports the official Pokémon Champions Regulation M-A species pool.
 *
 * Source: @pkmn/mods/champions FormatsData — species with tier !== "Illegal"
 * and base form only (~185–186 species, matching the in-game Reg M-A roster).
 *
 * Run: npm run data:champions-species
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Dex } = require('@pkmn/sim')
const champions = require('@pkmn/mods/champions')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'champions-species.json')

const FORMAT_ID = 'gen9championsvgc2026regma'

function isRegMABaseSpecies(species, formatsData) {
  const fd = formatsData[species.id]
  if (!fd || fd.tier === 'Illegal') return false
  if (!species.exists || species.num <= 0) return false
  if (species.id.startsWith('pokestar')) return false
  // Base species only (megas are selected via held item in-game)
  if (species.forme) return false
  return true
}

function main() {
  const dex = Dex.mod('champions', champions)
  const format = dex.formats.get(FORMAT_ID)
  if (!format) throw new Error(`Format ${FORMAT_ID} not found`)

  const species = []

  for (const id in dex.data.Pokedex) {
    const s = dex.species.get(id)
    if (!isRegMABaseSpecies(s, dex.data.FormatsData)) continue

    species.push({
      id: s.id,
      name: s.name,
      num: s.num,
      types: s.types,
      baseSpecies: s.baseSpecies,
      forme: '',
    })
  }

  species.sort((a, b) => a.num - b.num || a.name.localeCompare(b.name))

  return {
    formatId: FORMAT_ID,
    formatName: format.name,
    regulation: 'Regulation Set M-A',
    source:
      '@pkmn/mods/champions FormatsData (tier ≠ Illegal, base forms)',
    exportedAt: new Date().toISOString(),
    count: species.length,
    species,
  }
}

const payload = main()
mkdir(dirname(OUT), { recursive: true })
  .then(() => writeFile(OUT, JSON.stringify(payload)))
  .then(() => {
    console.log(
      `Wrote ${payload.count} species (${payload.regulation}) → ${OUT}`,
    )
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
