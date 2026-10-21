import { setTimeout as sleep } from 'node:timers/promises'
import { Client, Pool } from 'pg'
import Cursor from 'pg-cursor'
import * as sinon from 'sinon'
import { Kysely, PostgresDialect, sql } from '../../../dist/index.js'
import { Deferred } from '../../../dist/util/deferred.js'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  DIALECT_CONFIGS,
  expect,
  initTest,
  type Database,
  type TestContext,
} from './test-setup.js'

const dialect = DIALECTS.find((dialect) => dialect.variant === 'postgres')

if (dialect) {
  describe('postgres: rollback failure', () => {
    const sandbox = sinon.createSandbox()
    let ctx: TestContext
    let db: Kysely<Database>
    let pool: Pool
    let initialPid: number
    let querySpy: sinon.SinonSpy
    let releases: unknown[]

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      pool = new Pool({
        ...DIALECT_CONFIGS.postgres,
        max: 1,
        query_timeout: 200,
      })
      db = new Kysely<Database>({
        dialect: new PostgresDialect({ pool, cursor: Cursor }),
      })
      initialPid = await getPid(db)
      releases = []
      pool.on('release', (error) => releases.push(error))
      querySpy = sandbox.spy(Client.prototype, 'query')
    })

    afterEach(async () => {
      sandbox.restore()
      await db.destroy()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should keep the client after a standalone query times out', async () => {
      await expectTimeout(db)
      await expectReusableClient({ waitForRecovery: true })
    })

    it('should keep the client when a connection callback throws after a query timeout', async () => {
      await expect(
        db.connection().execute((connection) => {
          return sql`select pg_sleep(1)`.execute(connection)
        }),
      ).to.be.rejectedWith('Query read timeout')

      await expectReusableClient({ waitForRecovery: true })
    })

    it('should keep the client when a connection callback catches a query timeout', async () => {
      await db.connection().execute(async (connection) => {
        await expectTimeout(connection)
        expect(releases).to.deep.equal([])
      })

      await expectReusableClient({ waitForRecovery: true })
    })

    it('should keep the client after closing a timed-out stream', async () => {
      await db.connection().execute(async (connection) => {
        const stream = connection
          .selectNoFrom(sql`pg_sleep(1)`.as('sleep'))
          .stream()
        const error = await stream.next().catch((error: unknown) => error)

        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Query read timeout')
        expect(releases).to.deep.equal([])
      })

      await expectReusableClient()
    })

    for (const catchesTimeout of [false, true]) {
      it(`should discard the client when a transaction callback ${catchesTimeout ? 'catches' : 'throws'} a timeout`, async () => {
        let error: unknown
        let queryCount = 0

        const result = await db
          .transaction()
          .execute(async (trx) => {
            await insertUncommittedPerson(trx)
            error = await expectTimeout(trx)
            queryCount = querySpy.callCount

            if (catchesTimeout) {
              expect(releases).to.deep.equal([])
            } else {
              throw error
            }
          })
          .catch((error: unknown) => error)

        expect(result).to.be.instanceOf(Error)
        expect((result as Error).message).to.equal('Query read timeout')
        expect(result).to.not.equal(error)
        expect(
          querySpy
            .getCalls()
            .slice(queryCount)
            .map((call) => call.args[0]),
        ).to.deep.equal(catchesTimeout ? ['commit', 'rollback'] : ['rollback'])
        await expectDiscardedClient()
      })
    }

    it('should discard the client when a controlled transaction rollback times out', async () => {
      const trx = await db.startTransaction().execute()
      try {
        await insertUncommittedPerson(trx)
        const error = await expectTimeout(trx)
        const queryCount = querySpy.callCount

        const commitError = await trx
          .commit()
          .execute()
          .catch((err: unknown) => err)
        expect(commitError).to.be.instanceOf(Error)
        expect((commitError as Error).message).to.equal('Query read timeout')
        expect(commitError).to.not.equal(error)
        expect(releases).to.deep.equal([])
        await expect(trx.rollback().execute()).to.be.rejectedWith(
          'Query read timeout',
        )

        expect(
          querySpy
            .getCalls()
            .slice(queryCount)
            .map((call) => call.args[0]),
        ).to.deep.equal(['commit', 'rollback'])
        expect(trx.isCommitted).to.be.false
        expect(trx.isRolledBack).to.be.true
        await expectDiscardedClient()
      } finally {
        if (!trx.isCommitted && !trx.isRolledBack) {
          await trx
            .rollback()
            .execute()
            .catch(() => {})
        }
      }
    })

    for (const api of ['callback', 'controlled'] as const) {
      it(`should reject queries queued behind a failed ${api} transaction rollback`, async () => {
        const client = await pool.connect()
        client.release()
        releases.length = 0

        const error = new Error('rollback rejected before reaching PostgreSQL')
        const rollbackStarted = new Deferred<void>()
        const failedRollback = new Deferred<never>()
        querySpy.restore()
        const queryStub = sandbox.stub(client, 'query').callThrough()
        queryStub.withArgs('rollback').callsFake(() => {
          rollbackStarted.resolve()
          return failedRollback.promise
        })

        await db.connection().execute(async (connection) => {
          const rollback = (async () => {
            if (api === 'callback') {
              return await connection.transaction().execute(async (trx) => {
                await insertUncommittedPerson(trx)
                throw new Error('application error')
              })
            }

            const trx = await connection.startTransaction().execute()
            try {
              await insertUncommittedPerson(trx)
              return await trx.rollback().execute()
            } finally {
              if (!trx.isCommitted && !trx.isRolledBack) {
                await trx.rollback().execute()
              }
            }
          })().catch((err: unknown) => err)

          try {
            await rollbackStarted.promise
            const queryCount = queryStub.callCount

            const queuedQuery = connection
              .insertInto('person')
              .values({ first_name: 'queued', gender: 'other' })
              .execute()
              .catch((err: unknown) => err)
            const queuedCommit = sql`commit`
              .execute(connection)
              .catch((err: unknown) => err)
            const stream = connection.selectFrom('person').selectAll().stream()
            const queuedStream = stream.next().catch((err: unknown) => err)

            failedRollback.reject(error)
            expect(await rollback).to.equal(error)

            for (const result of await Promise.all([
              queuedQuery,
              queuedCommit,
              queuedStream,
            ])) {
              expect(result).to.be.instanceOf(Error)
              expect((result as Error).message).to.equal(
                'Postgres connection cannot be used after a failed rollback',
              )
            }

            expect(queryStub.callCount).to.equal(queryCount)
            expect(releases).to.deep.equal([])
          } finally {
            failedRollback.reject(error)
            await rollback
          }
        })

        await expectDiscardedClient()
      })
    }

    it('should reject further operations after a timed-out rollback even after pg recovers', async () => {
      await db.connection().execute(async (connection) => {
        const error = await connection
          .transaction()
          .execute(async (trx) => {
            await insertUncommittedPerson(trx)
            return sql`select pg_sleep(1)`.execute(trx)
          })
          .catch((error: unknown) => error)

        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Query read timeout')
        await sleep(1_000)
        const queryCount = querySpy.callCount
        const message =
          'Postgres connection cannot be used after a failed rollback'

        await expect(getPid(connection)).to.be.rejectedWith(message)
        await expect(
          getPid(connection.withSchema('public')),
        ).to.be.rejectedWith(message)
        const stream = connection.selectFrom('person').selectAll().stream()
        await expect(stream.next()).to.be.rejectedWith(message)
        await expect(
          connection.transaction().execute(async () => {}),
        ).to.be.rejectedWith(message)
        await expect(
          connection.selectFrom('person').selectAll().execute({
            signal: new AbortController().signal,
            inflightQueryAbortStrategy: 'cancel query',
          }),
        ).to.be.rejectedWith(message)

        expect(querySpy.callCount).to.equal(queryCount)
        expect(releases).to.deep.equal([])
      })

      await expectDiscardedClient()
    })

    it('should reuse a client that recovers inside a connection callback', async () => {
      await db.connection().execute(async (connection) => {
        await expectTimeout(connection, 0.3)
        expect(await getPid(connection)).to.equal(initialPid)
        expect(releases).to.deep.equal([])
      })

      await expectReusableClient()
    })

    it('should allow a stream to recover after a query timeout', async () => {
      await db.connection().execute(async (connection) => {
        await expectTimeout(connection, 0.3)
        const rows: { pid: number }[] = []

        for await (const row of connection
          .selectNoFrom(sql<number>`pg_backend_pid()`.as('pid'))
          .stream()) {
          rows.push(row)
        }

        expect(rows).to.deep.equal([{ pid: initialPid }])
        expect(releases).to.deep.equal([])
      })

      await expectReusableClient()
    })

    it('should reuse a client when a callback transaction rollback succeeds after a query timeout', async () => {
      let error: unknown
      const result = await db
        .transaction()
        .execute(async (trx) => {
          await insertUncommittedPerson(trx)
          error = await expectTimeout(trx, 0.3)
          throw error
        })
        .catch((error: unknown) => error)

      expect(result).to.equal(error)
      expect(querySpy.lastCall.args[0]).to.equal('rollback')
      await expectReusableClient()
      expect(
        await ctx.db.selectFrom('person').selectAll().execute(),
      ).to.deep.equal([])
    })

    it('should reuse a client when a controlled transaction rollback succeeds after a query timeout', async () => {
      const trx = await db.startTransaction().execute()
      try {
        await insertUncommittedPerson(trx)
        await expectTimeout(trx, 0.3)
        await trx.rollback().execute()

        expect(trx.isRolledBack).to.be.true
        await expectReusableClient()
        expect(
          await ctx.db.selectFrom('person').selectAll().execute(),
        ).to.deep.equal([])
      } finally {
        if (!trx.isCommitted && !trx.isRolledBack) {
          await trx
            .rollback()
            .execute()
            .catch(() => {})
        }
      }
    })

    it('should keep the client usable after a regular query error', async () => {
      await db.connection().execute(async (connection) => {
        await expect(
          sql`select missing_query_timeout_column`.execute(connection),
        ).to.be.rejectedWith('does not exist')

        expect(await getPid(connection)).to.equal(initialPid)
      })

      expect(releases).to.deep.equal([false])
      expect(pool.idleCount).to.equal(1)
      expect(await getPid(db)).to.equal(initialPid)
    })

    it('should keep the client usable after a server statement timeout', async () => {
      await db.connection().execute(async (connection) => {
        await sql`set statement_timeout = '50ms'`.execute(connection)
        await expect(
          sql`select pg_sleep(0.6)`.execute(connection),
        ).to.be.rejectedWith('canceling statement due to statement timeout')

        expect(await getPid(connection)).to.equal(initialPid)
      })

      expect(releases).to.deep.equal([false])
      expect(pool.idleCount).to.equal(1)
      expect(await getPid(db)).to.equal(initialPid)
    })

    async function expectTimeout(
      connection: Kysely<Database>,
      seconds = 1,
    ): Promise<unknown> {
      const error = await sql`select pg_sleep(${seconds})`
        .execute(connection)
        .catch((error: unknown) => error)

      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.equal('Query read timeout')
      return error
    }

    async function expectReusableClient({
      waitForRecovery = false,
    } = {}): Promise<void> {
      expect(releases).to.deep.equal([false])
      expect(pool.totalCount).to.equal(1)
      expect(pool.idleCount).to.equal(1)

      if (waitForRecovery) {
        await sleep(1_000)
      }

      expect(await getPid(db)).to.equal(initialPid)
    }

    async function expectDiscardedClient(): Promise<void> {
      expect(releases).to.deep.equal([true])
      expect(pool.totalCount).to.equal(0)
      expect(pool.idleCount).to.equal(0)
      expect(await getPid(db)).to.not.equal(initialPid)

      await db.transaction().execute((trx) => {
        return trx
          .insertInto('person')
          .values({ first_name: 'committed', gender: 'other' })
          .execute()
      })

      const people = await ctx.db
        .selectFrom('person')
        .select('first_name')
        .execute()
      expect(people).to.deep.equal([{ first_name: 'committed' }])
    }

    async function insertUncommittedPerson(
      connection: Kysely<Database>,
    ): Promise<void> {
      await connection
        .insertInto('person')
        .values({ first_name: 'uncommitted', gender: 'other' })
        .execute()
    }

    async function getPid(connection: Kysely<Database>): Promise<number> {
      const result = await sql<{
        pid: number
      }>`select pg_backend_pid() as pid`.execute(connection)
      return result.rows[0].pid
    }
  })
}
