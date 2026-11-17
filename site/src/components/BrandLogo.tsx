import type { JSX } from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import { usePluginData } from '@docusaurus/useGlobalData'
import type { BrandLogoSpriteData } from '../../plugins/generate-brand-logo-sprite'
import type { BrandLogo } from '../data/brand-logos'
import styles from './BrandLogo.module.css'

export function BrandLogoSvg({
  logo,
  loaded,
  requested,
  showFallback,
}: {
  logo: BrandLogo
  loaded: boolean
  requested: boolean
  showFallback: boolean
}): JSX.Element {
  const { fileName } = usePluginData(
    'generate-brand-logo-sprite',
  ) as BrandLogoSpriteData
  const spriteUrl = useBaseUrl(`/img/${fileName}`)
  const [x, y, width, height] = logo.viewBox.split(' ').map(Number)

  return (
    <svg
      aria-label={logo.label}
      className={styles.brandLogo}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={logo.viewBox}
    >
      {!loaded && showFallback && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          dominantBaseline="central"
          fontSize={Math.min(height * 0.75, width / (logo.label.length * 0.65))}
          textAnchor="middle"
        >
          {logo.label}
        </text>
      )}
      <use
        href={requested ? `${spriteUrl}#${logo.id}` : undefined}
        visibility={loaded ? 'visible' : 'hidden'}
      />
    </svg>
  )
}
