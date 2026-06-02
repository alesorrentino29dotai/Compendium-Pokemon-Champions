import { toId } from './toId'

/** Spreadsheet / pokepaste display names → Champions species id. */
const ALIASES: Record<string, string> = {
  floetteeternalmega: 'floetteeternal',
  'floette-mega': 'floetteeternal',
  floettemega: 'floetteeternal',
  charizardmegay: 'charizard',
  charizardmegax: 'charizard',
  venusaurmega: 'venusaur',
  blastoisemega: 'blastoise',
  gengarmega: 'gengar',
  gyaradosmega: 'gyarados',
  lucariomega: 'lucario',
  kangaskhanmega: 'kangaskhan',
  salamencemega: 'salamence',
  metagrossmega: 'metagross',
  garchompmega: 'garchomp',
  abomasnowmega: 'abomasnow',
  audinomega: 'audino',
  sharpedomega: 'sharpedo',
  slowbromega: 'slowbro',
  steelixmega: 'steelix',
  pidgeotmega: 'pidgeot',
  beedrillmega: 'beedrill',
  alakazammega: 'alakazam',
  aerodactylmega: 'aerodactyl',
  ampharosmega: 'ampharos',
  heracrossmega: 'heracross',
  houndoommega: 'houndoom',
  sableyemega: 'sableye',
  scizormega: 'scizor',
  tyranitarmega: 'tyranitar',
  mawilemega: 'mawile',
  aggronmega: 'aggron',
  manectricmega: 'manectric',
  altariamega: 'altaria',
  glaliemega: 'glalie',
  dianciemega: 'diancie',
  latiosmega: 'latios',
  latiasmega: 'latias',
  rayquazamega: 'rayquaza',
}

let championsIds: Set<string> | null = null
let championsByName: Map<string, string> | null = null

export function initChampionsSpeciesIndex(
  species: { id: string; name: string }[],
): void {
  championsIds = new Set(species.map((s) => s.id))
  championsByName = new Map(species.map((s) => [toId(s.name), s.id]))
}

/**
 * Resolve a team-sheet or pokepaste species label to a Champions dex id.
 */
export function resolveVgcSpeciesName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  const rawId = toId(trimmed)
  const alias = ALIASES[rawId] ?? ALIASES[trimmed.toLowerCase()]
  if (alias && championsIds?.has(alias)) return alias
  if (championsIds?.has(rawId)) return rawId

  const byName = championsByName?.get(rawId)
  if (byName) return byName

  if (!championsIds) return null

  for (const id of championsIds) {
    if (rawId.includes(id) || id.includes(rawId)) return id
  }

  return null
}
