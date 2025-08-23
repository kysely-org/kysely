import React from 'react'
import { useColorMode } from '@docusaurus/theme-common'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { SectionFeatures } from '../components/SectionFeatures'
import { DemoVideo } from '../components/DemoVideo'
import { SectionQuotes } from '../components/SectionQuotes'
import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero', styles.heroBanner, 'dark-theme')}>
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div className={styles.wave} />
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroSubtitle}>
            The type-safe SQL <br />
            query builder for TypeScript
          </p>
          <span style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <a
              href="/docs/getting-started"
              className="button button--primary button--md button--block"
              style={{
                background: 'var(--gray-12)',
                color: 'var(--gray-1)',
                borderColor: 'var(--gray-12)',
              }}
            >
              Getting started
            </a>
            <a
              href="https://github.com/kysely-org/kysely"
              className="button button--secondary button--md button--block"
            >
              View on GitHub
            </a>
          </span>
        </div>

        <DemoVideo />
      </div>
    </header>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title}>
      <div className={styles.siteWrapper}>
        <HomepageHeader />
      </div>
      <main>
        <SectionFeatures />

        <SectionQuotes />

        <SectionPlayground />

        <SectionExamplesCTA />
      </main>
    </Layout>
  )
}

const STACKBLITZ_URL = 'https://stackblitz.com/edit/react-ts-pppzf5'
const STACKBLITZ_PARAMS = new URLSearchParams({
  embed: '1',
  file: 'playground.ts',
  hideExplorer: '1',
  hideNavigation: '1',
})

function SectionPlayground() {
  const { colorMode } = useColorMode()

  const [src, setSrc] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    STACKBLITZ_PARAMS.set('theme', colorMode)

    setSrc(`${STACKBLITZ_URL}?${STACKBLITZ_PARAMS}`)
  }, [colorMode])

  // Prevent automatic focus on mobile
  useEffect(() => {
    if (window.innerWidth > 768) return // Only apply on mobile

    const preventInitialFocus = () => {
      if (iframeRef.current) {
        iframeRef.current.blur()
      }
    }

    // Prevent focus immediately and after a short delay
    preventInitialFocus()
    const timeout = setTimeout(preventInitialFocus, 1000)

    return () => clearTimeout(timeout)
  }, [src])

  return (
    <section className={styles.playgroundSection}>
      <div className={clsx('container', styles.playgroundContainer)}>
        <h1>Try it out for yourself!</h1>
        <p>
          Modify the query on the left and view the generated SQL on the right.
        </p>
        <iframe
          ref={iframeRef}
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          className={styles.playground}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          src={src}
          tabIndex={-1}
          title="Kysely Demo"
        />
      </div>
    </section>
  )
}

function SectionExamplesCTA() {
  return (
    <section className={styles.examplesCTASection}>
      <div className={styles.examplesCTAContainer}>
        <h1>Looking for code examples?</h1>
        <p>
          From finding a single record to complex joins, our docs have examples
          to get you started quickly.
        </p>
        <span className={styles.examplesCTA}>
          <a
            className="button button--primary button--lg"
            href="/docs/category/examples"
            style={{ width: '220px' }}
          >
            Jump right in
          </a>
        </span>
      </div>
    </section>
  )
}
