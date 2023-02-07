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
        classes of errors and let's you sleep pacefully at night.
      </>
    ),
  },
  {
    title: 'Simple',

    description: (
      <>
        Kysely is a light abstraction layer over SQL. This makes it easy to
        reason about performance, and reduces the amount of concepts you need to
        learn to be proficient with the library.
      </>
    ),
  },
  {
    title: 'Autocompletion',

    description: (
      <>
        By exposing your database schema to the TypeScript compiler, you get
        autocompletion on column names, field names, etc.
      </>
    ),
  },
  {
    title: 'Multi-dialect support',

    description: (
      <>
        MySQL, PostgreSQL or Sqlite? We've got you covered. There's also a
        growing ecosystem of dialects.
      </>
    ),
  },

  {
    title: 'Runs on every javascript environment',

    description: (
      <>
        Kysely runs on node.js, Deno and the browser.{' '}
        <a href="/docs/category/other-runtimes">Learn more.</a>
      </>
    ),
  },
  {
    title: 'Serverless & the edge',
    description: (
      <>
        Kysely works in serverless and edge environments, even on Deno! It also
        has support for using the PlanetScale database driver using{' '}
        <a href="https://github.com/depot/kysely-planetscale">
          kysely-planetscale
        </a>
        .
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
