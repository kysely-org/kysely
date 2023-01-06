import { DialectAdapter } from '../dialect-adapter.js'
import { PostgresDialect } from '../postgres/postgres-dialect.js'
import { CockroachAdapter } from './cockroach-adapter.js'

/**
 * CockroachDB dialect that uses the [pg](https://node-postgres.com/) library.
 *
 * The constructor takes an instance of {@link PostgresDialectConfig}.
 *
 * ```ts
 * import { Pool } from 'pg'
 *
 * new CockroachDialect({
 *   pool: new Pool({
 *     database: 'some_db',
 *     host: 'localhost',
 *   })
 * })
 * ```
 *
 * If you want the pool to only be created once it's first used, `pool`
 * can be a function:
 *
 * ```ts
 * import { Pool } from 'pg'
 *
 * new CockroachDialect({
 *   pool: async () => new Pool({
 *     database: 'some_db',
 *     host: 'localhost',
 *   })
 * })
 * ```
 */
export class CockroachDialect extends PostgresDialect {
  createAdapter(): DialectAdapter {
    return new CockroachAdapter()
  }
}
