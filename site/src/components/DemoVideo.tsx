import { useEffect, useRef } from 'react'
import styles from './DemoVideo.module.css'

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

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
  }, [])

  return (
    <div className={styles.videoContainer}>
      <video
        height="610"
        loop
        muted
        playsInline
        poster="/demo-poster.webp"
        preload="none"
        ref={videoRef}
        width="824"
      >
        <source src="/demo_optimized.webm" type="video/webm" />
        <source src="/demo.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
