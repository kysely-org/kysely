import React, { JSX, useEffect, useState } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import clsx from 'clsx'

import { DemoVideo } from '../components/DemoVideo'
import { SectionFeatures } from '../components/SectionFeatures'
import { SectionQuotes } from '../components/SectionQuotes'
import {
  compilerSnippetHtml,
  compositionSnippetHtml,
} from '../components/snippets.generated'
import productionProof from '../data/production-proof.json'
import styles from './index.module.css'

const GITHUB_URL = 'https://github.com/kysely-org/kysely'
const IN_PRODUCTION_URL = 'https://github.com/kysely-org/kysely/issues/320'

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <div className={styles.landing}>
        <SectionHero />
        <SectionStats />
        <SectionProduction />
        <SectionFeatures />
        <SectionCompiler />
        <SectionComposition />
        <SectionQuotes />
        <SectionPlayground />
        <SectionExamplesCTA />
      </div>
    </Layout>
  )
}

function SectionHero() {
  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <div>
          <span className={styles.eyebrow}>TypeScript · MIT · since 2021</span>
          <h1 className={styles.heroTitle}>
            The type-safe SQL query builder for TypeScript
          </h1>
          <p className={styles.heroSubtitle}>
            Kysely compiles 1:1 to the SQL you expect, infers precise result
            types from your queries, and catches broken queries at compile time
            — with zero runtime dependencies.
          </p>
          <div className={styles.heroButtons}>
            <a
              href="/docs/getting-started"
              className={clsx(styles.btn, styles.btnPrimary)}
            >
              Get started
            </a>
            <a
              href={GITHUB_URL}
              className={clsx(styles.btn, styles.btnSecondary)}
            >
              View on GitHub
            </a>
          </div>
        </div>

        <DemoVideo />
      </div>
    </header>
  )
}

// Rendered at build time and shown until the live numbers arrive — also the
// permanent values for visitors with JavaScript disabled or the APIs blocked.
const FALLBACK_STATS = {
  downloads: '12M+',
  stars: '14k+',
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: 'compact',
  })
    .format(value)
    .replace('K', 'k')
}

function useLiveStats() {
  const [downloads, setDownloads] = useState<number | null>(null)
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('https://api.npmjs.org/downloads/point/last-week/kysely', {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.downloads === 'number') {
          setDownloads(data.downloads)
        }
      })
      .catch(() => {})

    fetch('https://api.github.com/repos/kysely-org/kysely', {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.stargazers_count === 'number') {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return { downloads, stars }
}

function SectionStats() {
  const { downloads, stars } = useLiveStats()

  const stats = [
    {
      label: 'weekly npm downloads',
      title:
        downloads != null
          ? `${downloads.toLocaleString('en')} in the last 7 days`
          : undefined,
      value:
        downloads != null
          ? formatCompact(downloads)
          : FALLBACK_STATS.downloads,
    },
    {
      label: 'GitHub stars',
      title: stars != null ? stars.toLocaleString('en') : undefined,
      value: stars != null ? formatCompact(stars) : FALLBACK_STATS.stars,
    },
    { label: 'runtime dependencies', title: undefined, value: '0' },
    { label: 'built-in dialects', title: undefined, value: '5' },
  ]

  return (
    <section className={styles.stats}>
      <div className={clsx('container', styles.statsInner)}>
        {stats.map(({ label, title, value }) => (
          <div key={label} className={styles.stat} title={title}>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Each name in src/data/production-proof.json links to public evidence of
// runtime dependence: internal usage or a manifest, pinned to a commit SHA
// by scripts/verify-proof-links.mjs, or a public statement by an employee.
function SectionProduction() {
  return (
    <section className={styles.production}>
      <div className={clsx('container', styles.productionInner)}>
        <span className={styles.productionCaption}>In production at</span>
        <span className={styles.productionNames}>
          {productionProof.map(({ href, name }) => (
            <a key={name} href={href}>
              {name}
            </a>
          ))}
          <a className={styles.productionCTA} href={IN_PRODUCTION_URL}>
            + add your team
          </a>
        </span>
      </div>
    </section>
  )
}

function SectionCompiler() {
  return (
    <section className={styles.compiler}>
      <div className={clsx('container', styles.compilerInner)}>
        <div className={styles.compilerCopy}>
          <h2>Broken queries don't ship</h2>
          <p>
            Column typos, impossible joins, mistyped values — Kysely surfaces
            them in your editor as you type, not in production at 3am.
          </p>
          <p>
            Rename a column in your schema types, and the compiler walks you
            through every query that needs updating.
          </p>
        </div>
        <div className={styles.editor}>
          <div className={styles.editorBar}>
            <span className={styles.editorDots}>
              <i />
              <i />
              <i />
            </span>
            person.repository.ts
          </div>
          <div
            className={styles.editorCode}
            dangerouslySetInnerHTML={{ __html: compilerSnippetHtml }}
          />
          <div className={styles.errPanel}>
            Argument of type <span>'"person.ag"'</span> is not assignable to
            parameter of type <span>{"'ReferenceExpression<DB, \"person\">'"}</span>
            . <span>ts(2345)</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionComposition() {
  return (
    <section className={styles.composition}>
      <div className={clsx('container', styles.compositionInner)}>
        <div className={styles.compositionCopy}>
          <h2>Queries that compose</h2>
          <p>
            Extract any fragment of a query into a plain, typed function and
            reuse it across queries. Expressions, subqueries, and CTEs all
            compose the same way — it's just TypeScript.
          </p>
          <p>
            Here, a correlated subquery returns each person's pets as typed,
            nested JSON — one query, one round trip, no relations DSL to learn.
          </p>
        </div>
        <div className={styles.editor}>
          <div className={styles.editorBar}>
            <span className={styles.editorDots}>
              <i />
              <i />
              <i />
            </span>
            person.helpers.ts
          </div>
          <div
            className={styles.editorCode}
            dangerouslySetInnerHTML={{ __html: compositionSnippetHtml }}
          />
          <div className={styles.typePanel}>
            <span>const person:</span>{' '}
            {
              "{ id: number; first_name: string; pets: { name: string; species: 'dog' | 'cat' }[] }"
            }
          </div>
        </div>
      </div>
    </section>
  )
}

const STACKBLITZ_URL = 'https://stackblitz.com/edit/react-ts-pppzf5'
const STACKBLITZ_PARAMS = new URLSearchParams({
  ctl: '1',
  embed: '1',
  file: 'playground.ts',
  hidedevtools: '1',
  hideExplorer: '1',
  hideNavigation: '1',
  showSidebar: '0',
  theme: 'dark',
})

function SectionPlayground() {
  return (
    <section className={styles.playgroundSection}>
      <div className={clsx('container', styles.playgroundContainer)}>
        <h2>Try it out for yourself!</h2>
        <p>
          Modify the query on the left and view the generated SQL on the right.
        </p>
        <iframe
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          className={styles.playground}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          src={`${STACKBLITZ_URL}?${STACKBLITZ_PARAMS}`}
          tabIndex={-1}
          title="Kysely Demo"
          loading="lazy"
        />
      </div>
    </section>
  )
}

function SectionExamplesCTA() {
  return (
    <section className={styles.examplesCTASection}>
      <div className={styles.examplesCTAContainer}>
        <h2>Looking for code examples?</h2>
        <p>
          From finding a single record to complex joins, our docs have examples
          to get you started quickly.
        </p>
        <a
          className={clsx(styles.btn, styles.btnPrimary)}
          href="/docs/category/examples"
        >
          Jump right in
        </a>
      </div>
    </section>
  )
}
