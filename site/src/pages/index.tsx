import React, { JSX, useEffect, useRef, useState } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import clsx from 'clsx'

import { BrandLogoSvg, brandLogos } from '../components/BrandLogo'
import { DemoVideo } from '../components/DemoVideo'
import { SectionFeatures } from '../components/SectionFeatures'
import { SectionQuotes } from '../components/SectionQuotes'
import {
  compilerSnippetHtml,
  compositionSnippetHtml,
} from '../components/snippets.generated'
import packageJson from '../../package.json'
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
              href={`${GITHUB_URL}/releases/tag/v${packageJson.version}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              v{packageJson.version}
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
          <p className={styles.heroAudit}>
            or audit us on{' '}
            <a
              href="https://socket.dev/npm/package/kysely"
              rel="noopener noreferrer"
              target="_blank"
            >
              socket.dev
            </a>
          </p>
        </div>

        <DemoVideo />
      </div>
    </header>
  )
}

// Rendered at build time and shown until the live numbers arrive, and the
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
      href: 'https://npmx.dev/compare?packages=kysely,drizzle-orm,@prisma/client,typeorm,knex,sequelize,@mikro-orm/core&facets=downloads',
      label: 'weekly npm downloads',
      title:
        downloads != null
          ? `${downloads.toLocaleString('en')} in the last 7 days`
          : undefined,
      value:
        downloads != null ? formatCompact(downloads) : FALLBACK_STATS.downloads,
    },
    {
      href: 'https://ossinsight.io/analyze/kysely-org/kysely',
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

interface ProofEntry {
  name: string
  href: string
  group: string
  repo?: string
  path?: string
  sha?: string
  provenAt?: string
}

const proofEntries = productionProof as ProofEntry[]

// Proof strength, the hairline gauge on "in production at" cells. Evidence
// fades as it ages, with an 18-month half-life, until the two-year floor:
// beyond that everything is equally "old" instead of decaying toward an
// accusatory zero. Age quantizes to whole 30-day months so the SSG render
// and client hydration agree even when they happen on different days.
const STATEMENT_WEIGHT = 0.6
const PROOF_HALF_LIFE_MONTHS = 18
const PROOF_AGE_CAP_MONTHS = 24

function recencyFactor(provenAt?: string): number {
  if (!provenAt) {
    return 0.5
  }

  const months = Math.min(
    PROOF_AGE_CAP_MONTHS,
    Math.max(
      0,
      Math.floor((Date.now() - Date.parse(provenAt)) / (30 * 86_400_000)),
    ),
  )

  return 0.5 ** (months / PROOF_HALF_LIFE_MONTHS)
}

// Closed-source dependents can still show code: an npmx package-code link
// is the published dist, version-pinned, so it grades as code rather than
// as a statement (Cypress ships no public repo but ships the queries).
function isPinnedDist({ href, repo }: ProofEntry): boolean {
  return !repo && href.includes('/package-code/')
}

// "In production at" only: pinned code is a stronger claim than a public
// statement, decayed by evidence age. Built-into cells carry no gauge and
// no metrics; ranking fellow OSS projects is not this wall's job.
function proofStrength(entry: ProofEntry): number {
  const weight = entry.repo || isPinnedDist(entry) ? 1 : STATEMENT_WEIGHT
  return weight * recencyFactor(entry.provenAt)
}

// Production cells surface the proof's kind and date on hover; built-into
// chips carry only their name.
function proofTitle(entry: ProofEntry): string {
  const { href, name, provenAt, repo } = entry
  const kind = !repo
    ? isPinnedDist(entry)
      ? 'shipped code, version-pinned'
      : 'public statement'
    : href.includes('/blob/')
      ? 'code, pinned'
      : 'public statement, code-backed'

  return provenAt ? `${name} · ${kind} ${provenAt}` : name
}

// Marks that read clearer with text alongside: icon-only glyphs get the full
// name; wordmarks get only what the mark doesn't already say (the Prisma
// wordmark + "Studio").
const LOGO_WITH_NAME = new Set([
  'AirTrail',
  'Conar',
  'EmbedPDF',
  'Hot Updater',
  'inlang',
  'Materialize',
  'Notesnook',
  'OpenClaw',
  'Prisma Studio',
  'Replicas',
  'Stacks',
  'StudioCMS',
  'Supabase Lite',
  'Teable',
  'Tunarr',
  'wevm curl.md',
  'ZenStack',
])

function SectionProduction() {
  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLSpanElement>(null)

  // Hover peeks the explainer; a click pins it open until a click lands
  // outside or Escape is pressed.
  useEffect(() => {
    if (!helpOpen) {
      return
    }

    const onClick = (event: MouseEvent) => {
      if (!helpRef.current?.contains(event.target as Node)) {
        setHelpOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelpOpen(false)
      }
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [helpOpen])

  return (
    <section className={styles.production}>
      <div className={clsx('container', styles.productionInner)}>
        {PROOF_GROUPS.map(({ group, caption }) => (
          <React.Fragment key={group}>
            <span className={styles.productionCaption}>
              {caption}
              {group === 'production' && (
                <span
                  ref={helpRef}
                  className={clsx(
                    styles.proofHelp,
                    helpOpen && styles.proofHelpOpen,
                  )}
                >
                  <button
                    aria-expanded={helpOpen}
                    aria-label="How proof is graded"
                    className={clsx('clean-btn', styles.proofHelpButton)}
                    onClick={() => setHelpOpen((open) => !open)}
                    type="button"
                  >
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </button>
                  <span role="tooltip" className={styles.proofHelpPanel}>
                    Every logo links to public proof and is graded on age and
                    code over words.
                  </span>
                </span>
              )}
            </span>
            <span className={styles.productionNames}>
              {proofEntries
                .filter((entry) => entry.group === group)
                .map((entry) => {
                  const { href, name } = entry

                  return (
                    <a
                      key={name}
                      aria-label={name}
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                      title={group === 'production' ? proofTitle(entry) : name}
                    >
                      {brandLogos[name] ? (
                        <>
                          <BrandLogoSvg logo={brandLogos[name]} />
                          {LOGO_WITH_NAME.has(name) && (
                            <span>
                              {(name.startsWith(brandLogos[name].label)
                                ? name.slice(brandLogos[name].label.length)
                                : ''
                              ).trim() || name}
                            </span>
                          )}
                        </>
                      ) : (
                        name
                      )}
                      {group === 'production' && (
                        <span className={styles.proofBar}>
                          <span
                            style={{
                              width: `${Math.round(proofStrength(entry) * 100)}%`,
                            }}
                          />
                        </span>
                      )}
                    </a>
                  )
                })}
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
            Non-existent tables, misspelled columns, mistyped values: Kysely
            surfaces them as you type, as agents code, and as your schema
            evolves, not in production at 3am.
          </p>
          <p>
            When a column gets renamed, the TypeScript compiler walks you
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
              <span>{'\'ReferenceExpression<DB, "person">\''}</span>.{' '}
              <span>ts(2345)</span>
            </div>
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
            compose the same way. It's just TypeScript.
          </p>
          <p>
            Here, a correlated subquery returns each person's pets as typed,
            nested JSON. One query, one round trip, no relations DSL to learn.
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
        </div>
      </div>
    </section>
  )
}
