import styles from './SqlAbstractionSpectrum.module.css'

export function SqlQueryWorkflows() {
  return (
    <figure
      className={styles.figure}
      aria-label="Query builders, SQL in TypeScript, and SQL in SQL files"
    >
      <div className={styles.groups}>
        <div className={styles.group}>
          <h3>SQL query builders</h3>
          <ul>
            <li>
              <a href="/docs/getting-started">Kysely</a>
            </li>
            <li>
              <a href="https://knexjs.org/guide/query-builder.html">Knex</a>
            </li>
            <li>
              <a href="https://jawj.github.io/zapatos/">Zapatos</a>
            </li>
          </ul>
          <p>
            Compose clauses and expressions through a programming language API.
          </p>
        </div>
        <div className={styles.group}>
          <h3>SQL in TypeScript</h3>
          <ul>
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
            <li>
              <a href="https://safeql.dev/">SafeQL</a>
              <span>Schema-aware SQL checking</span>
            </li>
          </ul>
          <p>
            Write SQL alongside application code, with client and checking
            tools.
          </p>
        </div>
        <div className={styles.group}>
          <h3>SQL in SQL files</h3>
          <ul>
            <li>
              <a href="https://pgtyped.dev/docs/">PgTyped</a>
              <span>Generated typed query objects</span>
            </li>
            <li>
              <a href="https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/typedsql">
                Prisma TypedSQL
              </a>
              <span>Generated Prisma query functions</span>
            </li>
            <li>
              <a href="https://docs.sqlc.dev/">sqlc</a>
              <span>Generated calls via a TypeScript plugin</span>
            </li>
          </ul>
          <p>
            Write statements in SQL files and generate typed application calls.
          </p>
        </div>
      </div>
      <figcaption className={styles.caption}>
        Groups describe authoring interfaces; tools can span them or work
        together. PgTyped also accepts SQL in TypeScript. SafeQL checks SQL used
        through a client. Zapatos combines templates with typed helpers.
        SQL-file tools can add parameter syntax, annotations, or macros to SQL.
      </figcaption>
    </figure>
  )
}
