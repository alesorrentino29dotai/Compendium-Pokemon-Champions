const SHOWDOWN_SPRITES = 'https://play.pokemonshowdown.com/sprites'
const POKEAPI_ART =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'
const POKEAPI_ICON =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

/** Showdown dex sprite slug from display name (e.g. "Flutter Mane" → "flutter-mane"). */
export function nameToSpriteSlug(name: string): string {
  return name
    .replace(/['.]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Ordered fallbacks — first loadable URL wins in the UI. */
export function getSpeciesSpriteUrls(
  speciesId: string,
  speciesName: string,
  nationalNum: number,
): string[] {
  const slug = nameToSpriteSlug(speciesName)
  const urls = [
    `${SHOWDOWN_SPRITES}/dex/${slug}.png`,
    `${SHOWDOWN_SPRITES}/dex/${speciesId}.png`,
  ]

  if (nationalNum > 0) {
    urls.push(`${POKEAPI_ART}/${nationalNum}.png`)
    urls.push(`${POKEAPI_ICON}/${nationalNum}.png`)
  }

  return [...new Set(urls)]
}
