import type { JSX } from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  tag: string
  title: string
  description: string | JSX.Element
}

// One sentence per cell, for landing-page scannability. The original long
// copy is kept in comments below each entry — good candidates for expansion
// in the docs.
const FeatureList: FeatureItem[] = [
  // Original: "Kysely's state-of-the-art, type-safe API provides precise
  // result types and catches errors within queries at compile-time, giving
  // high-performing teams the confidence to ship at greater velocity. Use
  // `kysely-codegen` to make the database the source of types."
  {
    tag: 'type-safety',
    title: 'No compromises',
    description: (
      <>
        Precise result types and compile-time errors within queries — and with{' '}
        <a
          href="https://github.com/RobinBlomberg/kysely-codegen"
          rel="noopener noreferrer"
          target="_blank"
        >
          <code>kysely-codegen</code>
        </a>
        , your database is the source of types.
      </>
    ),
  },
  // Original: "Kysely is a thin abstraction layer over SQL, crafted by SQL
  // lovers for SQL lovers, focusing on familiarity through naming and
  // structure, and predictability through 1:1 compilation. Teams proficient
  // in SQL can pick up Kysely and be productive in minutes."
  {
    tag: 'wysiwyg',
    title: 'What you see is what you get',
    description: (
      <>
        A thin abstraction layer over SQL, crafted by SQL lovers for SQL lovers
        — familiar naming, predictable 1:1 compilation.
      </>
    ),
  },
  // Original: "Your database schema types flow through Kysely's fluent API,
  // offering a typing experience that's second only to full-blown database
  // IDEs. Get intelligent, context-aware suggestions for functions, table
  // names, and column names as you type."
  {
    tag: 'dx',
    title: 'Your schema, autocompleted',
    description: (
      <>
        Your database schema types flow through Kysely's fluent API — a typing
        experience second only to full-blown database IDEs.
      </>
    ),
  },
  // Original: "Kysely supports building a wide range of SQL queries, clauses,
  // functions, and expressions, including SELECT, INSERT, UPDATE, DELETE,
  // MERGE, WITH, and more. When needed, you can also use raw SQL strings,
  // even within structured queries."
  {
    tag: 'depth',
    title: 'The whole of SQL',
    description: (
      <>
        SELECT through MERGE, CTEs, window functions — with raw SQL escape
        hatches inside structured queries.
      </>
    ),
  },
  // Original: "Kysely's community-driven dialect system makes it easy to
  // implement support for any SQL database without waiting for the core team.
  // It ships with official dialects for PostgreSQL, MySQL, MS SQL Server,
  // SQLite, and PGlite right out of the box."
  {
    tag: 'dialects',
    title: 'Query any SQL database',
    description: (
      <>
        PostgreSQL, MySQL, MS SQL Server, SQLite, and PGlite out of the box —
        plus a community-driven dialect system for everything else.
      </>
    ),
  },
  // Original: "Kysely is lightweight, ships both CommonJS and ESM, has zero
  // dependencies, and avoids any environment-specific APIs. It can run in any
  // JavaScript environment, including Node.js, Deno, Bun, AWS Lambda,
  // Cloudflare Workers, and browsers."
  {
    tag: 'portability',
    title: 'Run anywhere',
    description: (
      <>
        Zero dependencies and no environment-specific APIs — runs in Node.js,
        Deno, Bun, AWS Lambda, Cloudflare Workers, and browsers.
      </>
    ),
  },
  // Original: "Kysely's migration module provides a flexible, non-opinionated
  // core for writing migrations in TypeScript, and running them in your
  // environment and pace of choice. Its community-driven ecosystem provides
  // file migration providers, CLIs, and more."
  {
    tag: 'migrations',
    title: 'Take control',
    description: (
      <>
        A flexible, non-opinionated core for writing and running TypeScript
        migrations — at your pace. Try{' '}
        <a
          href="https://github.com/kysely-org/kysely-ctl"
          rel="noopener noreferrer"
          target="_blank"
        >
          <code>kysely-ctl</code>
        </a>
        .
      </>
    ),
  },
  // Original: "Kysely's plugin system allows you tap into the process, and
  // modify queries before compilation and/or their results after execution.
  // This opens up various use cases, such as transforming camelCase names to
  // snake_case and vice versa."
  {
    tag: 'plugins',
    title: 'Extend everything',
    description: (
      <>
        Modify queries before compilation and results after execution —
        camelCase to snake_case and back, for example.
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
