import React from 'react'

export function DemoVideo() {
  return (
    <video
      style={{
        borderRadius: 12,
        boxShadow: 'var(--shadow-elevation-medium)',
        width: 800,
        height: 592,
      }}
      autoPlay
      muted
      playsInline
      loop
    >
      <source src="/demo.mp4" type="video/mp4" />
    </video>
  )
}
