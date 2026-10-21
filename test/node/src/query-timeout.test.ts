import { Pool, type PoolClient } from 'pg'
import Cursor from 'pg-cursor'
import * as sinon from 'sinon'
import { Kysely, PostgresDialect, sql } from '../../../dist/index.js'
import { Deferred } from '../../../dist/util/deferred.js'
import { DIALECTS, DIALECT_CONFIGS, expect } from './test-setup.js'

if (DIALECTS.some((dialect) => dialect.variant === 'postgres')) {
  describe('postgres: rollback failure', () => {
    const sandbox = sinon.createSandbox()
    let db: Kysely<unknown>
    let pool: Pool
    let client: PoolClient
    let releases: unknown[]

    beforeEach(async () => {
      pool = new Pool({
        ...DIALECT_CONFIGS.postgres,
        max: 1,
        query_timeout: 200,
      })
      db = new Kysely({
        dialect: new PostgresDialect({ pool, cursor: Cursor }),
      })
      client = await pool.connect()
      client.release()
      releases = []
      pool.on('release', (error) => releases.push(error))
    })

    afterEach(async () => {
      sandbox.restore()
      await db.destroy()
    })

    for (const api of ['callback', 'controlled'] as const) {
      it(`should discard the client and reject queued queries after a failed ${api} transaction rollback`, async () => {
        const error = new Error('rollback failed')
        const started = new Deferred<void>()
        const failed = new Deferred<never>()
        const query = sandbox.stub(client, 'query').callThrough()
        query.withArgs('rollback').callsFake(() => {
          started.resolve()
          return failed.promise
        })

        await db.connection().execute(async (connection) => {
          const rollback = (async () => {
            if (api === 'callback') {
              return await connection.transaction().execute(async () => {
                throw new Error('application error')
              })
            }

            const trx = await connection.startTransaction().execute()
            return await trx.rollback().execute()
          })()

          await started.promise
          const queryCount = query.callCount
          const queued = Promise.all(
            [
              sql`select 1`.execute(connection),
              sql`commit`.execute(connection),
              connection
                .selectNoFrom(sql`1`.as('value'))
                .stream()
                .next(),
            ].map((operation) =>
              expect(operation).to.be.rejectedWith(
                'Postgres connection has been discarded',
              ),
            ),
          )

          failed.reject(error)
          await expect(rollback).to.be.rejectedWith(error)
          await queued
          expect(query.callCount).to.equal(queryCount)
          expect(releases).to.deep.equal([])
        })

        expect(releases).to.deep.equal([true])
        expect(pool.totalCount).to.equal(0)
      })
    }

    it('should discard the client when rollback also times out', async () => {
      await expect(
        db.transaction().execute((trx) => sql`select pg_sleep(1)`.execute(trx)),
      ).to.be.rejectedWith('Query read timeout')

      expect(releases).to.deep.equal([true])
      expect(pool.totalCount).to.equal(0)
    })

    it('should reuse the client when rollback succeeds after a query timeout', async () => {
      const before = await sql`select pg_backend_pid()`.execute(db)
      releases.length = 0

      await expect(
        db
          .transaction()
          .execute((trx) => sql`select pg_sleep(0.3)`.execute(trx)),
      ).to.be.rejectedWith('Query read timeout')

      expect(releases).to.deep.equal([false])
      const after = await sql`select pg_backend_pid()`.execute(db)
      expect(after.rows).to.deep.equal(before.rows)
    })
  })
}
