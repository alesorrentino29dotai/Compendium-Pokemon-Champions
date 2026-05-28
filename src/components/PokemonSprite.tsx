import { useMemo, useState } from 'react'

import { getSpeciesSpriteUrls } from '../lib/sprites'

export interface PokemonSpriteProps {
  speciesId: string
  speciesName: string
  nationalNum: number
  size?: number
  className?: string
}

export function PokemonSprite({
  speciesId,
  speciesName,
  nationalNum,
  size = 40,
  className = '',
}: PokemonSpriteProps) {
  const urls = useMemo(
    () => getSpeciesSpriteUrls(speciesId, speciesName, nationalNum),
    [speciesId, speciesName, nationalNum],
  )
  const [index, setIndex] = useState(0)
  const failed = index >= urls.length

  if (failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400 dark:bg-gray-800 ${className}`}
        style={{ width: size, height: size }}
        title={speciesName}
      >
        ?
      </span>
    )
  }

  return (
    <img
      src={urls[index]}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      loading="lazy"
      decoding="async"
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
