import { expect } from 'chai'

import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseConnection,
  type QueryResult,
} from '../../../dist/index.js'

/**
 * Regression test for the single-connection mutex being leaked when a driver's
 * `releaseConnection` rejects.
 *
 * For single-connection dialects (`supportsMultipleConnections === false`, e.g.
 * SQLite / PGlite) `RuntimeDriver` serializes access with a `ConnectionMutex`.
 * The lock is obtained in `acquireConnection` and released in
 * `releaseConnection` AFTER awaiting the underlying driver's release. If that
 * await rejects, the lock must still be released — otherwise the next
 * `acquireConnection` waits on the mutex forever and the instance deadlocks.
 */
describe('single-connection mutex release', () => {
  class EmptyConnection implements DatabaseConnection {
    async executeQuery<R>(): Promise<QueryResult<R>> {
      return { rows: [] }
    }
    async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
      // no rows
    }
  }

  class FailingReleaseDriver extends DummyDriver {
    #releaseCount = 0

    override async acquireConnection(): Promise<DatabaseConnection> {
      return new EmptyConnection()
    }

    override async releaseConnection(): Promise<void> {
      this.#releaseCount++
      // Only the first release rejects; the instance must survive it.
      if (this.#releaseCount === 1) {
        throw new Error('driver releaseConnection failed')
      }
    }
  }

  function createDb(): Kysely<any> {
    return new Kysely<any>({
      dialect: {
        createAdapter: () => new SqliteAdapter(),
        createDriver: () => new FailingReleaseDriver(),
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
      },
    })
  }

  it('releases the connection mutex even when the driver release rejects', async () => {
    const db = createDb()

    // First query acquires the single connection; the driver's release rejects,
    // so the query rejects. The mutex lock must still be freed.
    let firstError: Error | undefined
    try {
      await db.selectFrom('person').selectAll().execute()
    } catch (error) {
      firstError = error as Error
    }
    expect(firstError?.message).to.equal('driver releaseConnection failed')

    // Second query must be able to acquire the connection again. If the mutex
    // lock leaked, this never resolves and the race below rejects.
    const secondQuery = db.selectFrom('person').selectAll().execute()
    const result = await Promise.race([
      secondQuery,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('DEADLOCK: second query never acquired the connection')),
          2000,
        ),
      ),
    ])

    expect(result).to.deep.equal([])

    await db.destroy()
  })
})
