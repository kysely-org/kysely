import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import HomepageFeatures from '@site/src/components/HomepageFeatures'

import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div
        className="container"
        style={{
          maxWidth: 485,
          textAlign: 'left',
        }}
      >
        <div>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        </div>
        <div></div>
      </div>
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 'calc(50% - 20px)',
          color: 'black',
          width: 40,
          fontSize: 24,
          textAlign: 'center',
        }}
      >
        ↓
      </span>
    </header>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />

        <section
          style={{
            marginTop: 20,
            width: '100%',
            height: `calc(100vh - var(--ifm-navbar-height))`,
            border: 0,
            marginBottom: -12,
            overflow: 'hidden',
            padding: 80,
            background: '#151515',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <iframe
            src="https://codesandbox.io/embed/kysely-demo-9l099t?fontsize=14&hidenavigation=1&module=%2Fsrc%2Fplayground.ts&theme=dark&codemirror=0&hidenavigation=1&view=split&highlights=6,7,8,9"
            style={{
              marginTop: -10,
              width: '100%',
              height: '100%',
              border: `8px solid #151515`,
              overflow: 'hidden',
              padding: 0,
              background: '#151515',
              borderRadius: 8,
            }}
            title="kysely-demo"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        </section>
      </main>
    </Layout>
  )
}
