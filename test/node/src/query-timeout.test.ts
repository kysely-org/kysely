import { Client, Pool } from 'pg'
import Cursor from 'pg-cursor'
import * as sinon from 'sinon'
import { Kysely, PostgresDialect, sql } from '../../../dist/index.js'
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
  describe('postgres: query timeout', () => {
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

    it('should discard the client after a standalone query times out', async () => {
      await expectTimeout(db)
      await expectDiscardedClient()
    })

    it('should discard the client when a connection callback throws after a timeout', async () => {
      await expect(
        db.connection().execute((connection) => {
          return sql`select pg_sleep(0.6)`.execute(connection)
        }),
      ).to.be.rejectedWith('Query read timeout')

      await expectDiscardedClient()
    })

    it('should reject further operations when a connection callback catches a timeout', async () => {
      await db.connection().execute(async (connection) => {
        const error = await expectTimeout(connection)
        await expectUnusableConnection(connection, error)
        expect(releases).to.deep.equal([])
      })

      await expectDiscardedClient()
    })

    it('should invalidate the connection when a stream times out', async () => {
      await db.connection().execute(async (connection) => {
        const stream = connection
          .selectNoFrom(sql`pg_sleep(0.6)`.as('sleep'))
          .stream()
        const error = await stream.next().catch((error: unknown) => error)

        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Query read timeout')
        await expectUnusableConnection(connection, error)
        expect(releases).to.deep.equal([])
      })

      await expectDiscardedClient()
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
              await expectUnusableConnection(trx, error)
              expect(releases).to.deep.equal([])
            } else {
              throw error
            }
          })
          .catch((error: unknown) => error)

        expect(result).to.equal(error)

        // Neither commit nor rollback should be sent after the timeout.
        expect(querySpy.callCount).to.equal(queryCount)
        await expectDiscardedClient()
      })
    }

    it('should invalidate a controlled transaction and discard its client on rollback', async () => {
      const trx = await db.startTransaction().execute()
      await insertUncommittedPerson(trx)
      const error = await expectTimeout(trx)
      await expectUnusableConnection(trx, error)
      await expectUnusableConnection(trx.withSchema('public'), error)
      const queryCount = querySpy.callCount

      await expect(trx.commit().execute()).to.be.rejectedWith(error as Error)
      expect(releases).to.deep.equal([])
      await expect(trx.rollback().execute()).to.be.rejectedWith(error as Error)

      expect(querySpy.callCount).to.equal(queryCount)
      expect(trx.isCommitted).to.be.false
      expect(trx.isRolledBack).to.be.true
      await expectDiscardedClient()
    })

    it('should keep an outer connection unusable after a transaction times out', async () => {
      await db.connection().execute(async (connection) => {
        const error = await connection
          .transaction()
          .execute(async (trx) => {
            await insertUncommittedPerson(trx)
            return sql`select pg_sleep(0.6)`.execute(trx)
          })
          .catch((error: unknown) => error)

        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Query read timeout')
        await expectUnusableConnection(connection, error)
        expect(releases).to.deep.equal([])
      })

      await expectDiscardedClient()
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
    ): Promise<unknown> {
      const error = await sql`select pg_sleep(0.6)`
        .execute(connection)
        .catch((error: unknown) => error)

      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.equal('Query read timeout')
      return error
    }

    async function expectUnusableConnection(
      connection: Kysely<Database>,
      error: unknown,
    ): Promise<void> {
      const queryCount = querySpy.callCount
      const query = connection.selectFrom('person').selectAll()

      await expect(query.execute()).to.be.rejectedWith(error as Error)
      const stream = query.stream()
      await expect(stream.next()).to.be.rejectedWith(error as Error)

      expect(querySpy.callCount).to.equal(queryCount)
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
