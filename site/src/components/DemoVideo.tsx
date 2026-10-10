import { useEffect, useRef, useState } from 'react'
import { useColorMode } from '@docusaurus/theme-common'
import useIsBrowser from '@docusaurus/useIsBrowser'
import clsx from 'clsx'
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
  // Docusaurus keeps the video client-only until hydration has finished.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [playbackOverride, setPlaybackOverride] = useState<boolean | null>(null)

  const sources = SOURCES[colorMode] ?? SOURCES.dark
  const shouldPlay = playbackOverride ?? !reducedMotion

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setReducedMotion(preference.matches)
      setPlaybackOverride(null)
    }

    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const { current: video } = videoRef

    if (!video) {
      return
    }

    if (!shouldPlay) {
      video.pause()
      return
    }

    const handleCanPlay = () => {
      video.play().catch(() => setPlaybackOverride(false))
      video.removeEventListener('canplay', handleCanPlay)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.load()

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      handleCanPlay()
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [isBrowser, colorMode, shouldPlay])

  return (
    <figure className={styles.frame}>
      <div className={styles.cropBox}>
        {/* CSS uses Docusaurus's early theme choice, before React hydrates. */}
        <div
          aria-hidden="true"
          className={clsx(styles.video, styles.poster, styles.darkPoster)}
          style={{ backgroundImage: `url(${SOURCES.dark.poster})` }}
        />
        <div
          aria-hidden="true"
          className={clsx(styles.video, styles.poster, styles.lightPoster)}
          style={{ backgroundImage: `url(${SOURCES.light.poster})` }}
        />
        {isBrowser && (
          <video
            key={colorMode}
            aria-label="Kysely autocomplete demonstration"
            className={styles.video}
            height="592"
            loop
            muted
            playsInline
            poster={sources.poster}
            preload="none"
            ref={videoRef}
            width="800"
          >
            <source src={sources.webm} type="video/webm" />
            <source src={sources.mp4} type="video/mp4" />
          </video>
        )}
        {isBrowser && (
          <button
            aria-label={shouldPlay ? 'Pause demo video' : 'Play demo video'}
            className={styles.playbackButton}
            onClick={() => setPlaybackOverride(!shouldPlay)}
            type="button"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              {shouldPlay ? (
                <>
                  <rect x="5" y="4" width="5" height="16" rx="1" />
                  <rect x="14" y="4" width="5" height="16" rx="1" />
                </>
              ) : (
                <path d="M7 4.5 20 12 7 19.5z" />
              )}
            </svg>
          </button>
        )}
      </div>
    </figure>
  )
}
