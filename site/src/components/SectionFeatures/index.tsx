import type { JSX } from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  tag: string
  title: string
  description: string | JSX.Element
}

// One sentence per cell, for landing-page scannability. The original long
// copy is kept in comments below each entry; good candidates for expansion
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
        Precise TypeScript result types and compile-time errors within queries.
        With{' '}
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
    tag: 'no magic',
    title: 'What you see is what you get',
    description: (
      <>
        A thin abstraction layer over SQL, crafted by SQL lovers for SQL
        lovers. Familiar naming, predictable 1:1 query compilation.
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
        Your database schema types flow through Kysely's fluent API. A typing
        experience second only to full-blown database IDEs.
      </>
    ),
  },
  // Original: "Kysely supports building a wide range of SQL queries, clauses,
  // functions, and expressions, including SELECT, INSERT, UPDATE, DELETE,
  // MERGE, WITH, and more. When needed, you can also use raw SQL strings,
  // even within structured queries."
  {
    tag: 'sql',
    title: 'Deeper than the rest',
    description: (
      <>
        Spec-faithful APIs for everything production teams need, composable
        all the way down, escape hatches everywhere.
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
        PostgreSQL, MySQL, MS SQL Server, SQLite, and PGlite out of the box,
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
        Zero dependencies and no environment-specific APIs. Runs in Node.js,
        Deno, Bun, AWS Lambda, Cloudflare Workers, and browsers.
      </>
    ),
  },
  // Benched 2026-08: the migrations story is optional and already covered in
  // the docs. Kept for reuse there.
  // {
  //   tag: 'no surprises',
  //   title: "If it ain't broke",
  //   description: "Up/down migrations as code, like we've always done it:
  //     reviewed in the PR, run as written. No outsourcing prod to a diff
  //     engine. Try kysely-ctl (https://github.com/kysely-org/kysely-ctl)."
  // },
  // Original: "Kysely's migration module provides a flexible, non-opinionated
  // core for writing migrations in TypeScript, and running them in your
  // environment and pace of choice. Its community-driven ecosystem provides
  // file migration providers, CLIs, and more."
  {
    tag: 'agent-ready',
    title: 'Manual included',
    description: (
      <>
        Everything is documented inline, with type-checked code examples that
        can't drift. Hover docs for humans, rich context for agents.
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
        Modify queries before compilation and results after execution.
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
        <p className={styles.sectionSub}>What Kysely optimizes for.</p>
        <div className={styles.grid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
