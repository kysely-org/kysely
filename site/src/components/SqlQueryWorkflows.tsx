import styles from './SqlAbstractionSpectrum.module.css'

export function SqlQueryWorkflows() {
  return (
    <figure
      className={styles.figure}
      aria-label="SQL files with tool syntax, SQL strings and templates, and SQL query builders"
    >
      <div className={styles.axis} aria-hidden="true">
        <span>Whole statement</span>
        <span>Composed statement</span>
      </div>
      <div className={styles.groups}>
        <div className={styles.group}>
          <p className={styles.title}>
            <a href="/docs/comparisons/query-builder-vs-raw-sql#add-the-optional-join-and-filters">
              SQL files with tool syntax
            </a>
          </p>
          <ul>
            <li>
              <a href="https://pgtyped.dev/docs/">PgTyped</a>
              <span>Annotations and parameter spreads</span>
            </li>
            <li>
              <a href="https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/typedsql">
                Prisma TypedSQL
              </a>
              <span>Typed parameter comments</span>
            </li>
            <li>
              <a href="https://docs.sqlc.dev/">sqlc</a>
              <span>Macros and query annotations</span>
            </li>
          </ul>
          <p>
            Write whole statements in SQL files, in the tool's syntax, and
            generate typed application calls.
          </p>
        </div>
        <div className={styles.group}>
          <p className={styles.title}>SQL strings and templates</p>
          <ul>
            <li>
              <a href="https://node-postgres.com/features/queries#parameterized-query">
                node-postgres
              </a>
              <span>SQL strings with $1 placeholders</span>
            </li>
            <li>
              <a href="https://github.com/porsager/postgres/blob/570be764d96c8c13e6a1a262103bf60974571b67/README.md#building-queries">
                Postgres.js
              </a>
              <span>SQL templates and fragments</span>
            </li>
            <li>
              <a href="https://github.com/gajus/slonik">Slonik</a>
              <span>SQL templates and result schemas</span>
            </li>
          </ul>
          <p>
            Write SQL beside application code, with clients that bind values.
          </p>
        </div>
        <div className={`${styles.group} ${styles.highlight}`}>
          <p className={styles.title}>SQL query builders</p>
          <ul>
            <li>
              <a href="/docs/getting-started">Kysely</a>
              <span>Checked composition and inferred results</span>
            </li>
            <li>
              <a href="https://knexjs.org/guide/query-builder.html">Knex</a>
              <span>Composition through an API</span>
            </li>
            <li>
              <a href="https://jawj.github.io/zapatos/">Zapatos</a>
              <span>Typed helpers over SQL templates</span>
            </li>
          </ul>
          <p>
            Compose clauses and expressions through an API that checks them.
          </p>
        </div>
        <div className={`${styles.group} ${styles.spanning}`}>
          <p className={styles.title}>SQL checkers</p>
          <ul>
            <li>
              <a href="https://safeql.dev/">SafeQL</a>
              <span>ESLint plugin for SQL templates and Kysely</span>
            </li>
          </ul>
          <p>Check whole statements against the database.</p>
        </div>
      </div>
      <figcaption className={styles.caption}>
        Grouped by where the statement is written, not ranked by capability.
        Each tool adds something a SQL console does not accept: interpolation
        and fragments in templates, parameter syntax or macros in SQL files.
        PgTyped also accepts SQL in TypeScript.
      </figcaption>
    </figure>
  )
}
