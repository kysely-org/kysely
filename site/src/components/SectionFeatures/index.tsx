import type { JSX } from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  tag: string
  title: string
  description: string | JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    tag: 'type-safety',
    title: 'Type-safety without compromises',
    description: (
      <>
        Kysely's state-of-the-art, type-safe API provides precise result types
        and catches errors within queries at compile-time, giving
        high-performing teams the confidence to ship at greater velocity. Use
        `kysely-codegen` to make the database the source of types.
      </>
    ),
  },
  {
    tag: 'wysiwyg',
    title: 'What you see is what you get',
    description: (
      <>
        Kysely is a thin abstraction layer over SQL, crafted by SQL lovers for
        SQL lovers, focusing on familiarity through naming and structure, and
        predictability through 1:1 compilation. Teams proficient in SQL can pick
        up Kysely and be productive in minutes.
      </>
    ),
  },
  {
    tag: 'dx',
    title: 'Write with great auto-completion',
    description: (
      <>
        Your database schema types flow through Kysely's fluent API, offering a
        typing experience that's second only to full-blown database IDEs. Get
        intelligent, context-aware suggestions for functions, table names, and
        column names as you type.
      </>
    ),
  },
  {
    tag: 'depth',
    title: 'Build SQL queries with unmatched depth',
    description: (
      <>
        Kysely supports building a wide range of SQL queries, clauses,
        functions, and expressions, including SELECT, INSERT, UPDATE, DELETE,
        MERGE, WITH, and more. When needed, you can also use raw SQL strings,
        even within structured queries.
      </>
    ),
  },
  {
    tag: 'dialects',
    title: 'Query any SQL database',
    description: (
      <>
        Kysely's community-driven dialect system makes it easy to implement
        support for any SQL database without waiting for the core team. It ships
        with official dialects for PostgreSQL, MySQL, MS SQL Server, SQLite, and
        PGlite right out of the box.
      </>
    ),
  },
  {
    tag: 'portability',
    title: 'Run anywhere',
    description: (
      <>
        Kysely is lightweight, ships both CommonJS and ESM, has zero
        dependencies, and avoids any environment-specific APIs. It can run in
        any JavaScript environment, including Node.js, Deno, Bun, AWS Lambda,
        Cloudflare Workers, and browsers.
      </>
    ),
  },
  {
    tag: 'migrations',
    title: 'Take control over your migrations',
    description: (
      <>
        Kysely's migration module provides a flexible, non-opinionated core for
        writing migrations in TypeScript, and running them in your environment
        and pace of choice. Its community-driven ecosystem provides file
        migration providers, CLIs, and more.
      </>
    ),
  },
  {
    tag: 'plugins',
    title: 'Extend with plugins',
    description: (
      <>
        Kysely's plugin system allows you tap into the process, and modify
        queries before compilation and/or their results after execution. This
        opens up various use cases, such as transforming camelCase names to
        snake_case and vice versa.
      </>
    ),
  },
]

function Feature({ tag, title, description }: FeatureItem) {
  return (
    <div className={styles.feature}>
      <span className={styles.featureKey}>{tag}</span>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  )
}

export function SectionFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.sectionHeading}>Show this to your boss!</h2>
        <p className={styles.sectionSub}>
          If you know SQL, you already know Kysely.
        </p>
        <div className={styles.grid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
