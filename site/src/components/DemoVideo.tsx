import { useEffect, useRef } from 'react'
import { useColorMode } from '@docusaurus/theme-common'
import useIsBrowser from '@docusaurus/useIsBrowser'
import styles from './DemoVideo.module.css'

// The light variants are the same footage passed through a Dark+ -> Light+
// 3D LUT (see scripts/make-light-lut.mjs). The video renders client-side
// only, after the color mode is known, so exactly one variant is fetched.
const SOURCES = {
  dark: {
    mp4: '/demo.mp4',
    poster: '/demo-poster.webp',
    webm: '/demo_optimized.webm',
  },
  light: {
    mp4: '/demo-light.mp4',
    poster: '/demo-poster-light.webp',
    webm: '/demo-light_optimized.webm',
  },
}

export function DemoVideo() {
  const isBrowser = useIsBrowser()
  const { colorMode } = useColorMode()
  const videoRef = useRef<HTMLVideoElement>(null)

  const sources = SOURCES[colorMode] ?? SOURCES.dark

  useEffect(() => {
    const { current: video } = videoRef

    if (!video) {
      return
    }

    video.load()

    const handleCanPlay = () => {
      video.play().catch(() => {})
      video.removeEventListener('canplay', handleCanPlay)
    }

    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [isBrowser, colorMode])

  return (
    <figure className={styles.frame}>
      <div className={styles.cropBox}>
        {isBrowser && (
          <video
            key={colorMode}
            className={styles.video}
            height="610"
            loop
            muted
            playsInline
            poster={sources.poster}
            preload="none"
            ref={videoRef}
            width="824"
          >
            <source src={sources.webm} type="video/webm" />
            <source src={sources.mp4} type="video/mp4" />
          </video>
        )}
      </div>
      <figcaption className={styles.caption}>
        real footage: schema-aware autocompletion and inline docs
      </figcaption>
    </figure>
  )
}
