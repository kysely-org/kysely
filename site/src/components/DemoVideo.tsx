import styles from './DemoVideo.module.css'

export function DemoVideo() {
  return (
    <div className={styles.videoContainer}>
      <video autoPlay muted playsInline loop width="832" height="468">
        <source src="/demo.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
