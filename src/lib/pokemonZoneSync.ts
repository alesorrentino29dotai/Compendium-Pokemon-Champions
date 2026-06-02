import championsSpecies from '../data/champions-species.json'
import type { PokemonZoneMetaBundle, PokemonZoneSpeciesMeta } from './metaStorage'
import { getBundledPokemonZoneMeta } from './pokemonZoneData'
import { resolveVgcSpeciesName } from './vgcTeamNames'

export const POKEMON_ZONE_INDEX_URL =
  'https://www.pokemon-zone.com/champions/pokemon/'

export { getBundledPokemonZoneMeta }

/** Try to read Next.js data blob from a species page HTML. */
function parseSpeciesPageHtml(html: string, speciesId: string): PokemonZoneSpeciesMeta | null {
  const nextMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  )
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]) as {
        props?: { pageProps?: Record<string, unknown> }
      }
      const pageProps = data.props?.pageProps
      if (pageProps && typeof pageProps === 'object') {
        const meta = extractMetaFromPageProps(pageProps)
        if (meta) return meta
      }
    } catch {
      /* ignore */
    }
  }

  if (html.length < 8000 || html.includes('Just a moment')) return null

  const teammates: PokemonZoneSpeciesMeta['teammates'] = []
  const linkRe = /\/champions\/pokemon\/([a-z0-9-]+)\/?/gi
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[1]
    if (slug === speciesId || seen.has(slug)) continue
    seen.add(slug)
    const id = resolveVgcSpeciesName(slug) ?? slug
    teammates.push({ speciesId: id, count: 1, pct: 0 })
    if (teammates.length >= 12) break
  }

  if (teammates.length === 0) return null
  return { teammates, items: [], builds: [] }
}

function extractMetaFromPageProps(
  pageProps: Record<string, unknown>,
): PokemonZoneSpeciesMeta | null {
  const stats = pageProps.stats ?? pageProps.meta ?? pageProps.pokemon
  if (!stats || typeof stats !== 'object') return null

  const raw = stats as Record<string, unknown>
  const out: PokemonZoneSpeciesMeta = {}

  if (typeof raw.appearances === 'number') out.appearances = raw.appearances

  if (Array.isArray(raw.teammates)) {
    out.teammates = raw.teammates
      .map((t) => {
        const row = t as Record<string, unknown>
        const slug = String(row.slug ?? row.id ?? row.species ?? '')
        const speciesId = resolveVgcSpeciesName(slug) ?? slug
        return {
          speciesId,
          count: Number(row.count ?? row.usage ?? 0),
          pct: Number(row.pct ?? row.percent ?? row.usage ?? 0),
        }
      })
      .filter((t) => t.speciesId)
  }

  if (Array.isArray(raw.items)) {
    out.items = raw.items.map((t) => {
      const row = t as Record<string, unknown>
      return {
        item: String(row.item ?? row.name ?? ''),
        count: Number(row.count ?? 0),
        pct: Number(row.pct ?? row.percent ?? 0),
      }
    })
  }

  if (Array.isArray(raw.builds) || Array.isArray(raw.sets)) {
    const list = (raw.builds ?? raw.sets) as unknown[]
    out.builds = list.map((b) => {
      const row = b as Record<string, unknown>
      return {
        ability: String(row.ability ?? ''),
        item: String(row.item ?? ''),
        moves: Array.isArray(row.moves)
          ? row.moves.map(String)
          : [],
        count: Number(row.count ?? 0),
        pct: Number(row.pct ?? row.percent ?? 0),
      }
    })
  }

  return Object.keys(out).length ? out : null
}

export async function fetchPokemonZoneSpeciesMeta(
  speciesId: string,
): Promise<PokemonZoneSpeciesMeta | null> {
  const url = `https://www.pokemon-zone.com/champions/pokemon/${speciesId}/`
  try {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) return null
    const html = await res.text()
    return parseSpeciesPageHtml(html, speciesId)
  } catch {
    return null
  }
}

export async function syncPokemonZoneFromWeb(options?: {
  maxSpecies?: number
  onProgress?: (done: number, total: number) => void
}): Promise<PokemonZoneMetaBundle | null> {
  const max = options?.maxSpecies ?? 24
  const ids = championsSpecies.species.slice(0, max).map((s) => s.id)
  const species: Record<string, PokemonZoneSpeciesMeta> = {}
  let done = 0

  for (const id of ids) {
    const meta = await fetchPokemonZoneSpeciesMeta(id)
    if (meta) species[id] = meta
    done++
    options?.onProgress?.(done, ids.length)
    await new Promise((r) => setTimeout(r, 120))
  }

  if (Object.keys(species).length === 0) return null

  return {
    exportedAt: new Date().toISOString(),
    source: POKEMON_ZONE_INDEX_URL,
    species,
  }
}

export function mergePokemonZoneMeta(
  base: PokemonZoneMetaBundle,
  patch: PokemonZoneMetaBundle,
): PokemonZoneMetaBundle {
  return {
    exportedAt: patch.exportedAt,
    source: patch.source,
    species: { ...base.species, ...patch.species },
  }
}
