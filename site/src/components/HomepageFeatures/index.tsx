import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

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
    title: 'Multi-dialect support',

    description: (
      <>
        MySQL, PostgreSQL or Sqlite? We've got you covered. There's also a
        growing ecosystem of dialects.
      </>
    ),
  },
  {
    title: 'Not an ORM',

    description: (
      <>
        Kysely is a very light abstraction layer over SQL. We help you build
        queries safely, we don't try to abstract away over SQL. This makes it
        easier to reason about performance.
      </>
    ),
  },
  {
    title: 'Runs on every environment',

    description: <>Kysely runs on node.js, deno and the browser.</>,
  },
]

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--6')} style={{ padding: 10 }}>
      <div className="padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div style={{ zIndex: 2 }} className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
