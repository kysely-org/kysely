import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { SectionFeatures } from '@site/src/components/SectionFeatures'

import styles from './index.module.css'
import { gray } from '@radix-ui/colors'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx('hero', styles.heroBanner)}>
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
        <div
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroSubtitle} >
            The type-safe SQL query builder for TypeScript
          </p>
          <span style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <a
              href="/docs/installation"
              className="button button--block button--md button-active button--primary"
            >
              Getting started
            </a>
            <a
              href="https://github.com/koskimas/kysely"
              className="button button--block button--md button-active button--secondary"
            >
              View on Github
            </a>
          </span>
        </div>
        <div>
          <img
            style={{
              borderRadius: 12,
              boxShadow: 'var(--shadow-elevation-medium)',
            }}
            src="https://github.com/koskimas/kysely/raw/master/assets/demo.gif"
          />
        </div>
      </div>

      <span
        className={styles.bouncyArrow}
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
      <div className={styles.siteWrapper}>
        <HomepageHeader />
      </div>
      <main>
        <SectionFeatures />

        <section className="container">
          <div
            style={{
              marginTop: 20,
              width: '100%',
              height: `calc(100vh - var(--ifm-navbar-height))`,
              border: 0,
              overflow: 'hidden',
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h1>Try it out for yourself!</h1>
            <p>
              Modify the query on the left and view the generated SQL on the
              right.
            </p>
            <iframe
              src="https://stackblitz.com/edit/react-ts-pppzf5?embed=1&file=playground.ts&hideExplorer=1&hideNavigation=1&theme=dark"
              style={{
                width: '100%',
                height: '100%',
                border: `1px solid ${gray.gray11}`,
                overflow: 'hidden',
                padding: 0,
                background: gray.gray12,
                borderRadius: 8,
              }}
              title="kysely-demo"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            />
          </div>
        </section>
      </main>
    </Layout>
  )
}
