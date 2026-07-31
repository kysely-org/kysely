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
import { version } from '../../package.json'
import productionProof from '../data/production-proof.json'
import styles from './index.module.css'

const GITHUB_URL = 'https://github.com/kysely-org/kysely'
const IN_PRODUCTION_URL = 'https://github.com/kysely-org/kysely/issues/320'
// Igal's versioning-philosophy comment on "Roadmap to v1.0?"
const STABILITY_URL =
  'https://github.com/kysely-org/kysely/issues/1328#issuecomment-2602609767'
// The AdonisJS creator's type-safety deep dive across TypeScript ORMs
const TYPE_SAFETY_URL = 'https://github.com/thetutlage/meta/discussions/8'
const TEST_FOLDER_BASE_URL =
  'https://github.com/kysely-org/kysely/tree/master/test'

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <div className={styles.landing}>
        <SectionHero />
        <SectionStats />
        <SectionProduction />
        <SectionCompiler />
        <SectionComposition />
        <SectionFeatures />
        <SectionQuotes />
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
          <span className={styles.eyebrow}>
            <a
              href={`${GITHUB_URL}/releases/tag/v${version}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              v{version}
            </a>{' '}
            ·{' '}
            <a
              href={`${GITHUB_URL}/blob/master/LICENSE`}
              rel="noopener noreferrer"
              target="_blank"
            >
              MIT
            </a>{' '}
            ·{' '}
            <a
              href={`${GITHUB_URL}/commit/8af0017741a355281cbe0d9d3352bffea51eb64c`}
              rel="noopener noreferrer"
              target="_blank"
            >
              since 2021
            </a>
          </span>
          <h1 className={styles.heroTitle}>
            Kysely
            <span className={styles.heroCategory}>
              <a
                href={TYPE_SAFETY_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Type-safe
              </a>{' '}
              SQL query builder
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            <a href={STABILITY_URL} rel="noopener noreferrer" target="_blank">
              Mature
            </a>
            , predictable SQL, precise types, tight feedback loops.
            <br />
            Runs everywhere:{' '}
            <a
              href={`${TEST_FOLDER_BASE_URL}/node`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Node
            </a>
            ,{' '}
            <a
              href={`${TEST_FOLDER_BASE_URL}/deno`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Deno
            </a>
            ,{' '}
            <a
              href={`${TEST_FOLDER_BASE_URL}/bun`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Bun
            </a>
            ,{' '}
            <a
              href={`${TEST_FOLDER_BASE_URL}/cloudflare-workers`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Workers
            </a>
            ,{' '}
            <a
              href={`${TEST_FOLDER_BASE_URL}/browser`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Browsers
            </a>
            .
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
  contributors: '150+',
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
  const [contributors, setContributors] = useState<number | null>(null)
  const [downloads, setDownloads] = useState<number | null>(null)
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    // The total lives in the Link header's last-page number.
    fetch(
      'https://api.github.com/repos/kysely-org/kysely/contributors?per_page=1',
      { signal: controller.signal },
    )
      .then((response) => {
        const link = response.headers.get('link') ?? ''
        const match = link.match(/[?&]page=(\d+)>; rel="last"/)

        if (match) {
          setContributors(Number(match[1]))
        }
      })
      .catch(() => {})

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

  return { contributors, downloads, stars }
}

function SectionStats() {
  const { contributors, downloads, stars } = useLiveStats()

  const stats = [
    {
      href: 'https://npmtrends.com/@mikro-orm/core-vs-@prisma/client-vs-drizzle-orm-vs-knex-vs-kysely-vs-sequelize-vs-typeorm',
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
      href: `${GITHUB_URL}/stargazers`,
      label: 'GitHub stars',
      title: stars != null ? stars.toLocaleString('en') : undefined,
      value: stars != null ? formatCompact(stars) : FALLBACK_STATS.stars,
    },
    {
      href: 'https://www.npmjs.com/package/kysely?activeTab=dependencies',
      label: 'runtime dependencies',
      title: undefined,
      value: '0',
    },
    {
      href: `${GITHUB_URL}/graphs/contributors?all=1`,
      label: 'contributors',
      title:
        contributors != null
          ? `${contributors.toLocaleString('en')} on GitHub`
          : undefined,
      value:
        contributors != null
          ? formatCompact(contributors)
          : FALLBACK_STATS.contributors,
    },
  ]

  return (
    <section className={styles.stats}>
      <div className={clsx('container', styles.statsInner)}>
        {stats.map(({ href, label, title, value }) =>
          href ? (
            <a
              key={label}
              className={styles.stat}
              href={href}
              rel="noopener noreferrer"
              target="_blank"
              title={title}
            >
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </a>
          ) : (
            <div key={label} className={styles.stat} title={title}>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

// Each name in src/data/production-proof.json links to public evidence of
// runtime dependence: internal usage or a manifest, pinned to a commit SHA
// by scripts/verify-proof-links.mjs, or a public statement by an employee.
// "production" = the company's own deployed services run Kysely.
// "built-into" = Kysely is the product's data layer, running wherever it runs.
const PROOF_GROUPS = [
  { group: 'production', caption: 'In production at' },
  { group: 'built-into', caption: 'Built into' },
]

function SectionProduction() {
  return (
    <section className={styles.production}>
      <div className={clsx('container', styles.productionInner)}>
        {PROOF_GROUPS.map(({ group, caption }) => (
          <React.Fragment key={group}>
            <span className={styles.productionCaption}>{caption}</span>
            <span className={styles.productionNames}>
              {productionProof
                .filter((entry) => entry.group === group)
                .map(({ href, name }) => (
                  <a
                    key={name}
                    href={href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {name}
                  </a>
                ))}
              {group === 'production' && (
                <a
                  className={styles.productionCTA}
                  href={IN_PRODUCTION_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  + add your team
                </a>
              )}
            </span>
          </React.Fragment>
        ))}
        <span className={styles.productionFootnote}>
          every name links to public proof — a manifest, internal usage, or a
          statement on the record
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
        <div>
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
              parameter of type{' '}
              <span>{"'ReferenceExpression<DB, \"person\">'"}</span>.{' '}
              <span>ts(2345)</span>
            </div>
          </div>
          <div className={styles.editorCaption}>
            actual compiler output — ts(2345)
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
        <div>
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
          <div className={styles.editorCaption}>inferred type, verbatim</div>
        </div>
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
