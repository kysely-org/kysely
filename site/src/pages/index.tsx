import clsx from 'clsx'
import { useColorMode } from '@docusaurus/theme-common'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { SectionFeatures } from '@site/src/components/SectionFeatures'

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
                background: 'var(--gray12)',
                color: 'var(--gray1)',
                borderColor: 'var(--gray12)',
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

function SectionPlayground() {
  const { colorMode } = useColorMode()

  return (
    <section className={styles.playgroundSection}>
      <div className={clsx('container', styles.playgroundContainer)}>
        <h1>Try it out for yourself!</h1>
        <p>
          Modify the query on the left and view the generated SQL on the right.
        </p>
        <iframe
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          className={styles.playground}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          src={`https://stackblitz.com/edit/react-ts-pppzf5?embed=1&file=playground.ts&hideExplorer=1&hideNavigation=1&theme=${colorMode}`}
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
