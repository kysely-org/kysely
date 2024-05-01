import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'
import { gray } from '@radix-ui/colors'

type FeatureItem = {
  title: string
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Type-safe SQL queries',

    description: (
      <>
        Kysely lets you write type-safe SQL queries. This eliminates entire
        classes of errors and lets you sleep peacefully at night.
      </>
    ),
  },
  {
    title: 'No magic, just SQL',

    description: (
      <>
        Kysely is a light abstraction layer over SQL. This makes it easy to
        reason about performance, and reduces the number of concepts you need to
        learn to be proficient with the library.
      </>
    ),
  },
  {
    title: 'Great autocompletion',

    description: (
      <>
        By exposing your database schema to the TypeScript compiler, you get
        autocompletion on table names, column names, aliases, etc.
      </>
    ),
  },
  {
    title: 'Multi-dialect support',

    description: (
      <>
        PostgreSQL, MySQL, or SQLite? We've got you covered. There's also a
        growing ecosystem of third-party dialects, including PlanetScale, D3,
        SurrealDB, and more. <a href="/docs/dialects">Learn more.</a>
      </>
    ),
  },

  {
    title: 'Runs on every environment',

    description: (
      <>
        Kysely runs on node.js, the browser, serverless and edge environments,
        even on Deno! <a href="/docs/category/other-runtimes">Learn more.</a>
      </>
    ),
  },
  {
    title: 'Extensible core',
    description: (
      <>
        Kysely comes with a plugin system that lets you extend the core with
        your own functionality. <a href="/docs/plugins">Learn more.</a>
      </>
    ),
  },
]

function TickIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="122.877"
      height="101.052"
      x="0"
      y="0"
      version="1.1"
      viewBox="0 0 122.877 101.052"
      xmlSpace="preserve"
      {...props}
    >
      <path d="M4.43 63.63A14.383 14.383 0 01.003 53.52a14.393 14.393 0 014.015-10.281 14.372 14.372 0 0110.106-4.425 14.373 14.373 0 0110.283 4.012l24.787 23.851L98.543 3.989l1.768 1.349-1.77-1.355a2.27 2.27 0 01.479-.466A14.383 14.383 0 01109.243.022V.018l.176.016c3.623.24 7.162 1.85 9.775 4.766a14.383 14.383 0 013.662 10.412h.004l-.016.176a14.362 14.362 0 01-4.609 9.632L59.011 97.11l.004.004a2.157 2.157 0 01-.372.368 14.392 14.392 0 01-9.757 3.569 14.381 14.381 0 01-9.741-4.016L4.43 63.63z"></path>
    </svg>
  )
}

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--6')} style={{ padding: 10 }}>
      <div className="padding-horiz--md">
        <h3
          style={{
            color: gray.gray4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              color: 'red',
              width: 20,
              height: 20,
              fontSize: 12,
              background: 'var(--sky7)',
              borderRadius: 100,
              border: `1px solid var(--sky10)`,
            }}
          >
            <TickIcon style={{ width: 12, height: 12, fill: 'var(--sky12)' }} />
          </span>
          {title}
        </h3>
        <p style={{ color: gray.gray8 }}>{description}</p>
      </div>
    </div>
  )
}

export function SectionFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
