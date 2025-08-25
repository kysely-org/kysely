import type { JSX, SVGProps } from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  description: string | JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
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
    title: 'Query any SQL database',
    description: (
      <>
        Kysely's community-driven dialect system makes it easy to implement
        support for any SQL database without waiting for the core team. It ships
        with official dialects for PostgreSQL, MySQL, MS SQL Server, and SQLite
        right out of the box.
      </>
    ),
  },
  {
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
    title: 'Take control over your migrations',
    description: (
      <>
        Kysely includes optional up/down migration primitives, allowing you to
        move away from risky black box migration tools and write your own
        migrations. Use `kysely-ctl` to run your migrations directly in the
        terminal or within your CI/CD pipeline.
      </>
    ),
  },
  {
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

function TickIcon(props: SVGProps<SVGSVGElement>) {
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
        <h3 className={styles.featureTitle}>
          <span className={styles.tickContainer}>
            <TickIcon className={styles.tickIcon} />
          </span>
          {title}
        </h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  )
}

export function SectionFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.sectionHeading}>Show this to your boss!</h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
