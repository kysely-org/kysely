import * as sinon from 'sinon'
import { setImmediate } from 'node:timers/promises'
import { Connection, ISOLATION_LEVEL } from 'tedious'
import {
  CompiledQuery,
  ControlledTransaction,
  type DatabaseConnection,
  type Driver,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SqliteDialect,
  TRANSACTION_ACCESS_MODES,
} from '../../../dist/index.js'
import {
  DIALECTS,
  type Database,
  type TestContext,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  limit,
} from './test-setup.js'
import { PGlite } from '@electric-sql/pglite'
import { Deferred } from '../../../dist/util/deferred.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: controlled transaction`, () => {
    let ctx: TestContext
    const executedQueries: CompiledQuery[] = []
    const sandbox = sinon.createSandbox()
    let tediousBeginTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['beginTransaction']>,
      ReturnType<Connection['beginTransaction']>
    >
    let tediousCommitTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['commitTransaction']>,
      ReturnType<Connection['commitTransaction']>
    >
    let tediousRollbackTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['rollbackTransaction']>,
      ReturnType<Connection['rollbackTransaction']>
    >
    let tediousSaveTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['saveTransaction']>,
      ReturnType<Connection['saveTransaction']>
    >
    let pgliteTransactionSpy: sinon.SinonSpy<
      Parameters<PGlite['transaction']>,
      ReturnType<PGlite['transaction']>
    >

    before(async function () {
      ctx = await initTest(this, dialect, {
        log(event) {
          if (event.level === 'query') {
            executedQueries.push(event.query)
          }
        },
      })
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
      executedQueries.length = 0
      tediousBeginTransactionSpy = sandbox.spy(
        Connection.prototype,
        'beginTransaction',
      )
      tediousCommitTransactionSpy = sandbox.spy(
        Connection.prototype,
        'commitTransaction',
      )
      tediousRollbackTransactionSpy = sandbox.spy(
        Connection.prototype,
        'rollbackTransaction',
      )
      tediousSaveTransactionSpy = sandbox.spy(
        Connection.prototype,
        'saveTransaction',
      )
      pgliteTransactionSpy = sandbox.spy(PGlite.prototype, 'transaction')
    })

    afterEach(async () => {
      await clearDatabase(ctx)
      sandbox.restore()
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should be able to start and commit a transaction', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.commit().execute()

      if (sqlSpec === 'postgres') {
        const query = {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
          parameters: ['Foo', 'Barson', 'male'],
        }

        if (variant === 'pglite') {
          expect(pgliteTransactionSpy.calledOnce).to.be.true
        }

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql(
          variant === 'pglite'
            ? [query]
            : [
                { sql: 'begin', parameters: [] },
                query,
                { sql: 'commit', parameters: [] },
              ],
        )
      } else if (sqlSpec === 'mysql') {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'begin',
            parameters: [],
          },
          {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'commit', parameters: [] },
        ])
      } else if (sqlSpec === 'mssql') {
        expect(tediousBeginTransactionSpy.calledOnce).to.be.true
        expect(tediousBeginTransactionSpy.getCall(0).args[1]).to.be.undefined
        expect(tediousBeginTransactionSpy.getCall(0).args[2]).to.be.undefined

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
        ])

        expect(tediousCommitTransactionSpy.calledOnce).to.be.true
      } else {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'begin',
            parameters: [],
          },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'commit', parameters: [] },
        ])
      }

      const person = await ctx.db
        .selectFrom('person')
        .where('first_name', '=', 'Foo')
        .select('first_name')
        .executeTakeFirst()

      expect(person).not.to.be.undefined
    })

    it('should be able to start and rollback a transaction', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.rollback().execute()

      if (sqlSpec === 'postgres') {
        const query = {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
          parameters: ['Foo', 'Barson', 'male'],
        }

        if (variant === 'pglite') {
          expect(pgliteTransactionSpy.calledOnce).to.be.true
        }

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql(
          variant === 'pglite'
            ? [query]
            : [
                {
                  sql: 'begin',
                  parameters: [],
                },
                query,
                { sql: 'rollback', parameters: [] },
              ],
        )
      } else if (sqlSpec === 'mysql') {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'begin',
            parameters: [],
          },
          {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'rollback', parameters: [] },
        ])
      } else if (sqlSpec === 'mssql') {
        expect(tediousBeginTransactionSpy.calledOnce).to.be.true
        expect(tediousBeginTransactionSpy.getCall(0).args[1]).to.be.undefined
        expect(tediousBeginTransactionSpy.getCall(0).args[2]).to.be.undefined

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
        ])

        expect(tediousRollbackTransactionSpy.calledOnce).to.be.true
      } else {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'begin',
            parameters: [],
          },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'rollback', parameters: [] },
        ])
      }

      const person = await ctx.db
        .selectFrom('person')
        .where('first_name', '=', 'Foo')
        .select('first_name')
        .executeTakeFirst()

      expect(person).to.be.undefined
    })

    if (
      (sqlSpec === 'postgres' && variant !== 'pglite') ||
      sqlSpec === 'mysql'
    ) {
      for (const accessMode of TRANSACTION_ACCESS_MODES) {
        it(`should set the transaction access mode as "${accessMode}"`, async () => {
          const trx = await ctx.db
            .startTransaction()
            .setAccessMode(accessMode)
            .execute()

          await trx.selectFrom('person').selectAll().execute()

          await trx.commit().execute()

          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql(
            {
              postgres: [
                { sql: `start transaction ${accessMode}`, parameters: [] },
                { sql: 'select * from "person"', parameters: [] },
                { sql: 'commit', parameters: [] },
              ],
              mysql: [
                { sql: `set transaction ${accessMode}`, parameters: [] },
                { sql: 'begin', parameters: [] },
                { sql: 'select * from `person`', parameters: [] },
                { sql: 'commit', parameters: [] },
              ],
            }[sqlSpec],
          )
        })
      }
    }

    if (
      (sqlSpec === 'postgres' && variant !== 'pglite') ||
      sqlSpec === 'mysql' ||
      sqlSpec === 'mssql'
    ) {
      for (const isolationLevel of [
        'read uncommitted',
        'read committed',
        'repeatable read',
        'serializable',
        ...(sqlSpec === 'mssql' ? (['snapshot'] as const) : []),
      ] as const) {
        it(`should set the transaction isolation level as "${isolationLevel}"`, async () => {
          const trx = await ctx.db
            .startTransaction()
            .setIsolationLevel(isolationLevel)
            .execute()

          await insertSomething(trx)

          await trx.commit().execute()

          if (sqlSpec === 'mssql') {
            expect(tediousBeginTransactionSpy.calledOnce).to.be.true
            expect(tediousBeginTransactionSpy.getCall(0).args[1]).to.not.be
              .undefined
            expect(tediousBeginTransactionSpy.getCall(0).args[2]).to.equal(
              ISOLATION_LEVEL[
                isolationLevel.replace(' ', '_').toUpperCase() as any
              ],
            )
            expect(tediousCommitTransactionSpy.calledOnce).to.be.true
          }

          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql(
            {
              postgres: [
                {
                  sql: `start transaction isolation level ${isolationLevel}`,
                  parameters: [],
                },
                {
                  sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
                { sql: 'commit', parameters: [] },
              ],
              mysql: [
                {
                  sql: `set transaction isolation level ${isolationLevel}`,
                  parameters: [],
                },
                { sql: 'begin', parameters: [] },
                {
                  sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
                { sql: 'commit', parameters: [] },
              ],
              mssql: [
                {
                  sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
              ],
            }[sqlSpec],
          )
        })
      }
    }

    it('should be able to start a transaction with a single connection', async () => {
      await ctx.db.connection().execute(async (conn) => {
        const trx = await conn.startTransaction().execute()

        await insertSomething(trx)

        await trx.commit().execute()

        await insertSomethingElse(conn)

        const trx2 = await conn.startTransaction().execute()

        await insertSomething(trx2)

        await trx2.rollback().execute()

        await insertSomethingElse(conn)
      })

      const results = await ctx.db
        .selectFrom('person')
        .select('first_name')
        .orderBy('id', 'desc')
        .$call(limit(3, dialect))
        .execute()
      expect(results).to.eql([
        { first_name: 'Fizz' },
        { first_name: 'Fizz' },
        { first_name: 'Foo' },
      ])
    })

    it('should be able to savepoint and rollback to savepoint', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      const trxAfterFoo = await trx.savepoint('foo').execute()

      await insertSomethingElse(trxAfterFoo)

      await trxAfterFoo.rollbackToSavepoint('foo').execute()

      await trxAfterFoo.commit().execute()

      if (sqlSpec === 'postgres') {
        const ops = [
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'savepoint "foo"', parameters: [] },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
            parameters: ['Fizz', 'Buzzson', 'female'],
          },
          { sql: 'rollback to "foo"', parameters: [] },
        ]

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql(
          variant === 'pglite'
            ? ops
            : [
                { sql: 'begin', parameters: [] },
                ...ops,
                { sql: 'commit', parameters: [] },
              ],
        )
      } else if (sqlSpec === 'mysql') {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          { sql: 'begin', parameters: [] },
          {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'savepoint `foo`', parameters: [] },
          {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
            parameters: ['Fizz', 'Buzzson', 'female'],
          },
          { sql: 'rollback to `foo`', parameters: [] },
          { sql: 'commit', parameters: [] },
        ])
      } else if (sqlSpec === 'mssql') {
        expect(tediousBeginTransactionSpy.calledOnce).to.be.true
        expect(tediousBeginTransactionSpy.getCall(0).args[1]).to.be.undefined
        expect(tediousBeginTransactionSpy.getCall(0).args[2]).to.be.undefined

        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
            parameters: ['Fizz', 'Buzzson', 'female'],
          },
        ])

        expect(tediousSaveTransactionSpy.calledOnce).to.be.true
        expect(tediousSaveTransactionSpy.getCall(0).args[1]).to.equal('foo')

        expect(tediousRollbackTransactionSpy.calledOnce).to.be.true
        expect(tediousRollbackTransactionSpy.getCall(0).args[1]).to.equal('foo')

        expect(tediousCommitTransactionSpy.calledOnce).to.be.true
      } else {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          { sql: 'begin', parameters: [] },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'savepoint "foo"', parameters: [] },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
            parameters: ['Fizz', 'Buzzson', 'female'],
          },
          { sql: 'rollback to "foo"', parameters: [] },
          { sql: 'commit', parameters: [] },
        ])
      }

      const results = await ctx.db
        .selectFrom('person')
        .where('first_name', 'in', ['Foo', 'Fizz'])
        .select('first_name')
        .execute()

      expect(results).to.have.length(1)
      expect(results[0].first_name).to.equal('Foo')
    })

    if (sqlSpec === 'postgres' || sqlSpec === 'mysql' || sqlSpec === 'sqlite') {
      it('should be able to savepoint and release savepoint', async () => {
        const trx = await ctx.db.startTransaction().execute()

        await insertSomething(trx)

        const trxAfterFoo = await trx.savepoint('foo').execute()

        await insertSomethingElse(trxAfterFoo)

        await trxAfterFoo.releaseSavepoint('foo').execute()

        await trxAfterFoo.commit().execute()

        if (sqlSpec === 'postgres') {
          const ops = [
            {
              sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
              parameters: ['Foo', 'Barson', 'male'],
            },
            { sql: 'savepoint "foo"', parameters: [] },
            {
              sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
              parameters: ['Fizz', 'Buzzson', 'female'],
            },
            { sql: 'release "foo"', parameters: [] },
          ]

          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql(
            variant === 'pglite'
              ? ops
              : [
                  { sql: 'begin', parameters: [] },
                  ...ops,
                  { sql: 'commit', parameters: [] },
                ],
          )
        } else if (sqlSpec === 'mysql') {
          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql([
            { sql: 'begin', parameters: [] },
            {
              sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
              parameters: ['Foo', 'Barson', 'male'],
            },
            { sql: 'savepoint `foo`', parameters: [] },
            {
              sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
              parameters: ['Fizz', 'Buzzson', 'female'],
            },
            { sql: 'release savepoint `foo`', parameters: [] },
            { sql: 'commit', parameters: [] },
          ])
        } else {
          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql([
            { sql: 'begin', parameters: [] },
            {
              sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
              parameters: ['Foo', 'Barson', 'male'],
            },
            { sql: 'savepoint "foo"', parameters: [] },
            {
              sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
              parameters: ['Fizz', 'Buzzson', 'female'],
            },
            { sql: 'release "foo"', parameters: [] },
            { sql: 'commit', parameters: [] },
          ])
        }

        const results = await ctx.db
          .selectFrom('person')
          .where('first_name', 'in', ['Foo', 'Fizz'])
          .select('first_name')
          .orderBy('first_name')
          .execute()

        expect(results).to.have.length(2)
        expect(results[0].first_name).to.equal('Fizz')
        expect(results[1].first_name).to.equal('Foo')
      })
    }

    if (sqlSpec === 'mssql') {
      it('should throw an error when trying to release a savepoint as it is not supported', async () => {
        const trx = await ctx.db.startTransaction().execute()

        await expect(
          trx.releaseSavepoint('foo' as never).execute(),
        ).to.be.rejectedWith(
          'The `releaseSavepoint` method is not supported by this driver',
        )

        await trx.rollback().execute()
      })
    }

    it('should throw an error when trying to execute a query after the transaction has been committed', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.commit().execute()

      await expect(insertSomethingElse(trx)).to.be.rejectedWith(
        'Transaction is already committed',
      )
    })

    it('should throw an error when trying to execute a query after the transaction has been rolled back', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.rollback().execute()

      await expect(insertSomethingElse(trx)).to.be.rejectedWith(
        'Transaction is already rolled back',
      )
    })
  })
}

describe('custom dialect: controlled transaction', () => {
  const db = new Kysely<Database>({
    dialect: new (class extends SqliteDialect {
      createDriver(): Driver {
        const driver = class extends DummyDriver {}

        // @ts-ignore
        driver.prototype.releaseSavepoint = undefined
        // @ts-ignore
        driver.prototype.rollbackToSavepoint = undefined
        // @ts-ignore
        driver.prototype.savepoint = undefined

        return new driver()
      }
      // @ts-ignore
    })({}),
  })
  let trx: ControlledTransaction<Database>

  before(async () => {
    trx = await db.startTransaction().execute()
  })

  after(async () => {
    await trx.rollback().execute()
  })

  it('should throw an error when trying to savepoint on a dialect that does not support it', async () => {
    await expect(trx.savepoint('foo').execute()).to.be.rejectedWith(
      'The `savepoint` method is not supported by this driver',
    )
  })

  it('should throw an error when trying to rollback to a savepoint on a dialect that does not support it', async () => {
    await expect(
      trx.rollbackToSavepoint('foo' as never).execute(),
    ).to.be.rejectedWith(
      'The `rollbackToSavepoint` method is not supported by this driver',
    )
  })

  it('should throw an error when trying to release a savepoint on a dialect that does not support it', async () => {
    await expect(
      trx.releaseSavepoint('foo' as never).execute(),
    ).to.be.rejectedWith(
      'The `releaseSavepoint` method is not supported by this driver',
    )
  })
})

describe('controlled transaction', () => {
  const sandbox = sinon.createSandbox()
  let driver: Driver
  let connection: DatabaseConnection
  let db: Kysely<Database>

  beforeEach(async () => {
    driver = new DummyDriver()
    connection = await driver.acquireConnection()
    sandbox.stub(driver, 'acquireConnection').resolves(connection)
    db = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => driver,
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
    })
  })

  afterEach(async () => {
    sandbox.restore()
    await db.destroy()
  })

  it('should release the connection if the transaction fails to begin', async () => {
    const beginError = new Error('begin failed')
    sandbox.stub(driver, 'beginTransaction').rejects(beginError)
    const releaseSpy = sandbox.spy(driver, 'releaseConnection')

    const error = await db
      .startTransaction()
      .execute()
      .catch((error: unknown) => error)

    expect(error).to.equal(beginError)
    expect(releaseSpy.calledOnce, 'connection released once').to.be.true
    expect(releaseSpy.firstCall.args[0]).to.equal(connection)
  })

  for (const command of ['commit', 'rollback'] as const) {
    for (const fails of [false, true]) {
      it(`should wait for an ongoing query to ${fails ? 'fail' : 'finish'} before ${command}`, async () => {
        const queryStarted = new Deferred<void>()
        const queryFinished = new Deferred<void>()
        const queryError = new Error('query failed')
        sandbox.stub(connection, 'executeQuery').callsFake(async () => {
          queryStarted.resolve()
          await queryFinished.promise
          if (fails) throw queryError
          return { rows: [] }
        })
        const commandSpy = sandbox.spy(driver, `${command}Transaction`)
        const releaseSpy = sandbox.spy(driver, 'releaseConnection')
        const trx = await db.startTransaction().execute()
        const query = trx.selectFrom('person').selectAll().execute()
        const queryResult = query.catch((error: unknown) => error)
        await queryStarted.promise

        const completion = trx[command]().execute()
        await setImmediate()
        expect(commandSpy.notCalled, 'command waits for query').to.be.true
        expect(releaseSpy.notCalled, 'connection is held').to.be.true

        queryFinished.resolve()
        expect(await queryResult).to.eql(fails ? queryError : [])
        await completion
        expect(commandSpy.calledOnce).to.be.true
        expect(releaseSpy.calledOnce).to.be.true
      })
    }

    it(`should reject queued work after ${command}, including through derived handles`, async () => {
      const commandStarted = new Deferred<void>()
      const commandFinished = new Deferred<void>()
      const commandStub = sandbox
        .stub(driver, `${command}Transaction`)
        .callsFake(async () => {
          commandStarted.resolve()
          await commandFinished.promise
        })
      const querySpy = sandbox.spy(connection, 'executeQuery')
      const streamSpy = sandbox.spy(connection, 'streamQuery')
      const releaseSpy = sandbox.spy(driver, 'releaseConnection')
      const trx = await db.startTransaction().execute()
      const derived = trx.withSchema('public')
      const otherCommand = trx[command === 'commit' ? 'rollback' : 'commit']()
      const otherCommandSpy = sandbox.spy(
        driver,
        command === 'commit' ? 'rollbackTransaction' : 'commitTransaction',
      )
      const completion = derived[command]().execute()
      await commandStarted.promise

      const queuedWork = Promise.allSettled([
        trx.selectFrom('person').selectAll().execute(),
        derived
          .selectFrom('person')
          .selectAll()
          .execute({ signal: new AbortController().signal }),
        trx.selectFrom('person').selectAll().stream().next(),
        otherCommand.execute(),
      ])
      commandFinished.resolve()
      await completion

      for (const result of await queuedWork) {
        expect(result.status).to.equal('rejected')
        if (result.status === 'rejected') {
          expect(result.reason.message).to.equal(
            `Transaction is already ${command === 'commit' ? 'committed' : 'rolled back'}`,
          )
        }
      }
      expect(querySpy.notCalled).to.be.true
      expect(streamSpy.notCalled).to.be.true
      expect(otherCommandSpy.notCalled).to.be.true
      expect(commandStub.calledOnce).to.be.true
      expect(releaseSpy.calledOnce).to.be.true
      expect(trx.isCommitted).to.equal(command === 'commit')
      expect(trx.isRolledBack).to.equal(command === 'rollback')
    })

    it(`should allow retrying a failed ${command}`, async () => {
      const commandError = new Error(`${command} failed`)
      const commandStub = sandbox.stub(driver, `${command}Transaction`)
      commandStub.onFirstCall().rejects(commandError)
      commandStub.onSecondCall().resolves()
      const releaseSpy = sandbox.spy(driver, 'releaseConnection')
      const trx = await db.startTransaction().execute()
      const completion = trx[command]()

      expect(
        await completion.execute().catch((error: unknown) => error),
      ).to.equal(commandError)
      expect(trx.isCommitted).to.be.false
      expect(trx.isRolledBack).to.be.false
      expect(releaseSpy.notCalled).to.be.true

      await completion.execute()
      expect(commandStub.calledTwice).to.be.true
      expect(releaseSpy.calledOnce).to.be.true
    })

    it(`should wait for a stream to close before ${command}`, async () => {
      let streamClosed = false
      sandbox.stub(connection, 'streamQuery').callsFake(async function* () {
        try {
          yield { rows: [{ id: 1 }] }
        } finally {
          streamClosed = true
        }
      })
      const commandSpy = sandbox.spy(driver, `${command}Transaction`)
      const trx = await db.startTransaction().execute()
      const stream = trx.selectFrom('person').selectAll().stream()
      await stream.next()

      const completion = trx[command]().execute()
      await setImmediate()
      expect(commandSpy.notCalled).to.be.true

      await stream.return!()
      await completion
      expect(streamClosed).to.be.true
      expect(commandSpy.calledOnce).to.be.true
    })

    it(`should wait for an aborted query's database work before ${command}`, async () => {
      const queryStarted = new Deferred<void>()
      const queryFinished = new Deferred<void>()
      sandbox.stub(connection, 'executeQuery').callsFake(async () => {
        queryStarted.resolve()
        await queryFinished.promise
        return { rows: [] }
      })
      const commandSpy = sandbox.spy(driver, `${command}Transaction`)
      const trx = await db.startTransaction().execute()
      const controller = new AbortController()
      const query = trx
        .selectFrom('person')
        .selectAll()
        .execute({ signal: controller.signal })
      const queryResult = query.catch((error: unknown) => error)
      await queryStarted.promise
      const abortError = new Error('request aborted')
      controller.abort(abortError)
      expect(await queryResult).to.equal(abortError)

      const completion = trx[command]().execute()
      await setImmediate()
      expect(commandSpy.notCalled).to.be.true

      queryFinished.resolve()
      await completion
      expect(commandSpy.calledOnce).to.be.true
    })
  }
})

async function insertSomething(db: Kysely<Database>) {
  return await db
    .insertInto('person')
    .values({
      first_name: 'Foo',
      last_name: 'Barson',
      gender: 'male',
    })
    .executeTakeFirstOrThrow()
}

async function insertSomethingElse(db: Kysely<Database>) {
  return await db
    .insertInto('person')
    .values({
      first_name: 'Fizz',
      last_name: 'Buzzson',
      gender: 'female',
    })
    .executeTakeFirstOrThrow()
}
