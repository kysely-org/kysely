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
        Kysely let's you write type-safe SQL queries. This eliminates entire
        classes of errors and let's you sleep peacefully at night.
      </>
    ),
  },
  {
    title: 'No magic, just SQL',

    description: (
      <>
        Kysely is a light abstraction layer over SQL. This makes it easy to
        reason about performance, and reduces the amount of concepts you need to
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
        growing ecosystem of 3rd party dialects, including PlanetScale, D3,
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

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--6')} style={{ padding: 10 }}>
      <div className="padding-horiz--md">
        <h3 style={{ color: gray.gray4 }}>{title}</h3>
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
