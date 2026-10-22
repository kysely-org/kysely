import * as sinon from 'sinon'
import { setImmediate } from 'node:timers/promises'
import { Pool } from 'pg'
import { Connection, ISOLATION_LEVEL } from 'tedious'
import {
  CompiledQuery,
  ControlledTransaction,
  type DatabaseConnection,
  type Driver,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresDialect,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
  TRANSACTION_ACCESS_MODES,
} from '../../../dist/index.js'
import {
  DIALECTS,
  DIALECT_CONFIGS,
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

    if (variant === 'postgres') {
      it('should discard the client when rollback times out', async () => {
        const db = new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new Pool({
              ...DIALECT_CONFIGS.postgres,
              max: 1,
              query_timeout: 1_000,
            }),
          }),
        })

        try {
          const trx = await db.startTransaction().execute()
          await expect(sql`select pg_sleep(2.5)`.execute(trx)).to.be.rejected
          await expect(trx.rollback().execute()).to.be.rejected
          await insertSomething(db)
          await sql`rollback`.execute(db)

          const person = await ctx.db
            .selectFrom('person')
            .select('first_name')
            .where('first_name', '=', 'Foo')
            .executeTakeFirst()
          expect(person).to.eql({ first_name: 'Foo' })
        } finally {
          await db.destroy()
        }
      })
    }

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
  const sandbox = sinon.createSandbox()
  let driver: DummyDriver
  let db: Kysely<Database>
  let trx: ControlledTransaction<Database>
  let querySpy: sinon.SinonSpy
  let releaseSpy: sinon.SinonSpy

  beforeEach(async () => {
    driver = new DummyDriver()
    sandbox.stub(driver, 'savepoint').value(undefined)
    sandbox.stub(driver, 'rollbackToSavepoint').value(undefined)
    sandbox.stub(driver, 'releaseSavepoint').value(undefined)
    const connection = await driver.acquireConnection()
    sandbox.stub(driver, 'acquireConnection').resolves(connection)
    querySpy = sandbox.spy(connection, 'executeQuery')
    releaseSpy = sandbox.spy(driver, 'releaseConnection')
    db = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => driver,
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
    })
    trx = await db.startTransaction().execute()
  })

  afterEach(async () => {
    if (!trx.isCommitted && !trx.isRolledBack) {
      await trx.rollback().execute()
    }
    await db.destroy()
    sandbox.restore()
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

  it('should invalidate derived handles when the original transaction commits', async () => {
    const derivedTrx = trx.withSchema('public')

    await trx.commit().execute()

    expect(derivedTrx.isCommitted).to.be.true
    expect(derivedTrx.isRolledBack).to.be.false
    await expect(
      derivedTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    await expect(derivedTrx.commit().execute()).to.be.rejectedWith(
      'Transaction is already committed',
    )
    await expect(derivedTrx.rollback().execute()).to.be.rejectedWith(
      'Transaction is already committed',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate the original transaction when a derived handle commits', async () => {
    const derivedTrx = trx.withSchema('public')

    await derivedTrx.commit().execute()

    expect(trx.isCommitted).to.be.true
    expect(trx.isRolledBack).to.be.false
    await expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    await expect(trx.commit().execute()).to.be.rejectedWith(
      'Transaction is already committed',
    )
    await expect(trx.rollback().execute()).to.be.rejectedWith(
      'Transaction is already committed',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate derived handles when the original transaction rolls back', async () => {
    const derivedTrx = trx.withSchema('public')

    await trx.rollback().execute()

    expect(derivedTrx.isCommitted).to.be.false
    expect(derivedTrx.isRolledBack).to.be.true
    await expect(
      derivedTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    await expect(derivedTrx.commit().execute()).to.be.rejectedWith(
      'Transaction is already rolled back',
    )
    await expect(derivedTrx.rollback().execute()).to.be.rejectedWith(
      'Transaction is already rolled back',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate the original transaction when a derived handle rolls back', async () => {
    const derivedTrx = trx.withSchema('public')

    await derivedTrx.rollback().execute()

    expect(trx.isCommitted).to.be.false
    expect(trx.isRolledBack).to.be.true
    await expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    await expect(trx.commit().execute()).to.be.rejectedWith(
      'Transaction is already rolled back',
    )
    await expect(trx.rollback().execute()).to.be.rejectedWith(
      'Transaction is already rolled back',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should release the connection when rolling back fails', async () => {
    const rollbackError = new Error('rollback failed')
    sandbox.stub(driver, 'rollbackTransaction').rejects(rollbackError)

    await expect(trx.rollback().execute()).to.be.rejectedWith(rollbackError)

    expect(trx.isCommitted).to.be.false
    expect(trx.isRolledBack).to.be.true
    await expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    await expect(trx.rollback().execute()).to.be.rejectedWith(
      'Transaction is already rolled back',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
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

  async function startTransactionWithSavepoint() {
    const trx = await db.startTransaction().execute()
    return await trx.savepoint('foo').execute()
  }

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

  it('should allow retrying a failed commit', async () => {
    const commandError = new Error('commit failed')
    const commandStub = sandbox.stub(driver, 'commitTransaction')
    commandStub.onFirstCall().rejects(commandError)
    commandStub.onSecondCall().resolves()
    const releaseSpy = sandbox.spy(driver, 'releaseConnection')
    const trx = await db.startTransaction().execute()
    const completion = trx.commit()

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

  for (const command of ['commit', 'rollback'] as const) {
    const message = `Transaction is already ${command === 'commit' ? 'committed' : 'rolled back'}`

    it(`should reject saved commands after ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const commands = [
        trx.commit(),
        trx.rollback(),
        trx.savepoint('bar'),
        trx.rollbackToSavepoint('foo'),
        trx.releaseSavepoint('foo'),
      ]
      await trx[command]().execute()

      for (const savedCommand of commands) {
        await expect(savedCommand.execute()).to.be.rejectedWith(message)
      }
    })

    it(`should reject connection consumers immediately after ${command}`, async () => {
      const trx = await db.startTransaction().execute()
      await trx[command]().execute()
      const consumer = sandbox.spy(async () => undefined)

      expect(() => trx.getExecutor().provideConnection(consumer)).to.throw(
        `Transaction is already ${command === 'commit' ? 'committed' : 'rolled back'}`,
      )
      expect(consumer.notCalled).to.be.true
    })

    it(`should reject a query queued behind ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, `${command}Transaction`).returns(finished.promise)
      const querySpy = sandbox.spy(connection, 'executeQuery')
      const completion = trx[command]().execute()
      const query = expect(
        trx.selectFrom('person').selectAll().execute(),
      ).to.be.rejectedWith(message)

      finished.resolve()
      await completion
      await query
      expect(querySpy.notCalled).to.be.true
    })

    it(`should reject an abortable query queued behind ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, `${command}Transaction`).returns(finished.promise)
      const completion = trx[command]().execute()
      const query = expect(
        trx.selectFrom('person').selectAll().execute({
          signal: new AbortController().signal,
        }),
      ).to.be.rejectedWith(message)

      finished.resolve()
      await completion
      await query
    })

    it(`should reject a stream queued behind ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, `${command}Transaction`).returns(finished.promise)
      const completion = trx[command]().execute()
      const stream = expect(
        trx.selectFrom('person').selectAll().stream().next(),
      ).to.be.rejectedWith(message)

      finished.resolve()
      await completion
      await stream
    })

    it(`should reject commands queued behind ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, `${command}Transaction`).returns(finished.promise)
      const completion = trx[command]().execute()
      const commands = [
        trx.commit(),
        trx.rollback(),
        trx.savepoint('bar'),
        trx.rollbackToSavepoint('foo'),
        trx.releaseSavepoint('foo'),
      ]
      const results = commands.map((queuedCommand) =>
        expect(queuedCommand.execute()).to.be.rejectedWith(message),
      )

      finished.resolve()
      await completion
      await Promise.all(results)
    })

    it(`should reject a connection consumer queued behind ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, `${command}Transaction`).returns(finished.promise)
      const completion = trx[command]().execute()
      const consumer = sandbox.spy(async () => undefined)
      const result = expect(
        trx.getExecutor().provideConnection(consumer),
      ).to.be.rejectedWith(message)

      finished.resolve()
      await completion
      await result
      expect(consumer.notCalled).to.be.true
    })
  }

  it('should reject a queued query and release once when rollback fails', async () => {
    const trx = await startTransactionWithSavepoint()
    const finished = new Deferred<void>()
    const rollbackError = new Error('rollback failed')
    sandbox.stub(driver, 'rollbackTransaction').returns(finished.promise)
    const releaseSpy = sandbox.spy(driver, 'releaseConnection')
    const completion = trx.rollback().execute()
    const query = expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')

    finished.reject(rollbackError)
    expect(await completion.catch((error: unknown) => error)).to.equal(
      rollbackError,
    )
    await query
    expect(releaseSpy.calledOnce).to.be.true
  })

  type TransactionWithSavepoint = ControlledTransaction<Database, ['foo']>

  const savepointCommands = [
    {
      name: 'savepoint',
      driverMethod: 'savepoint',
      createCommand: (trx: TransactionWithSavepoint) => trx.savepoint('bar'),
    },
    {
      name: 'rollbackToSavepoint',
      driverMethod: 'rollbackToSavepoint',
      createCommand: (trx: TransactionWithSavepoint) =>
        trx.rollbackToSavepoint('foo'),
    },
    {
      name: 'releaseSavepoint',
      driverMethod: 'releaseSavepoint',
      createCommand: (trx: TransactionWithSavepoint) =>
        trx.releaseSavepoint('foo'),
    },
  ] as const

  const commands = [
    {
      name: 'commit',
      driverMethod: 'commitTransaction',
      createCommand: (trx: TransactionWithSavepoint) => trx.commit(),
    },
    {
      name: 'rollback',
      driverMethod: 'rollbackTransaction',
      createCommand: (trx: TransactionWithSavepoint) => trx.rollback(),
    },
    ...savepointCommands,
  ] as const

  for (const { name: command, driverMethod, createCommand } of commands) {
    it(`should wait for an ongoing query to finish before ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const queryFinished = new Deferred<void>()
      sandbox.stub(connection, 'executeQuery').callsFake(async () => {
        await queryFinished.promise
        return { rows: [] }
      })
      const commandSpy = sandbox.spy(driver, driverMethod)
      const releaseSpy = sandbox.spy(driver, 'releaseConnection')
      const query = trx.selectFrom('person').selectAll().execute()

      const completion = createCommand(trx).execute()
      await setImmediate()
      expect(commandSpy.notCalled, 'command waits for query').to.be.true
      expect(releaseSpy.notCalled, 'connection is held').to.be.true

      queryFinished.resolve()
      expect(await query).to.eql([])
      await completion
      expect(commandSpy.calledOnce).to.be.true
    })

    it(`should wait for an ongoing query to fail before ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const queryFinished = new Deferred<void>()
      const queryError = new Error('query failed')
      sandbox.stub(connection, 'executeQuery').callsFake(async () => {
        await queryFinished.promise
        throw queryError
      })
      const commandSpy = sandbox.spy(driver, driverMethod)
      const releaseSpy = sandbox.spy(driver, 'releaseConnection')
      const query = trx.selectFrom('person').selectAll().execute()
      const queryResult = query.catch((error: unknown) => error)

      const completion = createCommand(trx).execute()
      await setImmediate()
      expect(commandSpy.notCalled, 'command waits for query').to.be.true
      expect(releaseSpy.notCalled, 'connection is held').to.be.true

      queryFinished.resolve()
      expect(await queryResult).to.equal(queryError)
      await completion
      expect(commandSpy.calledOnce).to.be.true
    })

    it(`should wait for a stream to close before ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      let streamClosed = false
      sandbox.stub(connection, 'streamQuery').callsFake(async function* () {
        try {
          yield { rows: [{ id: 1 }] }
        } finally {
          streamClosed = true
        }
      })
      const commandSpy = sandbox.spy(driver, driverMethod)
      const stream = trx.selectFrom('person').selectAll().stream()
      await stream.next()

      const completion = createCommand(trx).execute()
      await setImmediate()
      expect(commandSpy.notCalled).to.be.true

      await stream.return!()
      await completion
      expect(streamClosed).to.be.true
      expect(commandSpy.calledOnce).to.be.true
    })

    it(`should wait for an aborted query's database work before ${command}`, async () => {
      const trx = await startTransactionWithSavepoint()
      const queryStarted = new Deferred<void>()
      const queryFinished = new Deferred<void>()
      sandbox.stub(connection, 'executeQuery').callsFake(async () => {
        queryStarted.resolve()
        await queryFinished.promise
        return { rows: [] }
      })
      const commandSpy = sandbox.spy(driver, driverMethod)
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

      const completion = createCommand(trx).execute()
      await setImmediate()
      expect(commandSpy.notCalled).to.be.true

      queryFinished.resolve()
      await completion
      expect(commandSpy.calledOnce).to.be.true
    })
  }

  for (const {
    name: command,
    driverMethod,
    createCommand,
  } of savepointCommands) {
    it(`should hold queries until ${command} finishes`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, driverMethod).returns(finished.promise)
      const querySpy = sandbox.spy(connection, 'executeQuery')
      const execution = createCommand(trx).execute()
      const query = trx
        .withSchema('public')
        .selectFrom('person')
        .selectAll()
        .execute()
      await setImmediate()
      expect(querySpy.notCalled).to.be.true

      finished.resolve()
      await execution
      await query
      expect(querySpy.calledOnce).to.be.true
    })

    it(`should let queued queries continue when ${command} fails`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      const commandError = new Error(`${command} failed`)
      sandbox.stub(driver, driverMethod).returns(finished.promise)
      const querySpy = sandbox.spy(connection, 'executeQuery')
      const execution = createCommand(trx).execute()
      const query = trx
        .withSchema('public')
        .selectFrom('person')
        .selectAll()
        .execute()
      await setImmediate()
      expect(querySpy.notCalled).to.be.true

      finished.reject(commandError)
      expect(await execution.catch((error: unknown) => error)).to.equal(
        commandError,
      )
      await query
      expect(querySpy.calledOnce).to.be.true
    })

    it(`should hold commit until ${command} finishes`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      sandbox.stub(driver, driverMethod).returns(finished.promise)
      const commitSpy = sandbox.spy(driver, 'commitTransaction')
      const execution = createCommand(trx).execute()
      const completion = trx.withSchema('public').commit().execute()
      await setImmediate()
      expect(commitSpy.notCalled).to.be.true

      finished.resolve()
      await execution
      await completion
      expect(commitSpy.calledOnce).to.be.true
    })

    it(`should hold rollback until ${command} fails`, async () => {
      const trx = await startTransactionWithSavepoint()
      const finished = new Deferred<void>()
      const commandError = new Error(`${command} failed`)
      sandbox.stub(driver, driverMethod).returns(finished.promise)
      const rollbackSpy = sandbox.spy(driver, 'rollbackTransaction')
      const execution = createCommand(trx).execute()
      const completion = trx.withSchema('public').rollback().execute()
      await setImmediate()
      expect(rollbackSpy.notCalled).to.be.true

      finished.reject(commandError)
      expect(await execution.catch((error: unknown) => error)).to.equal(
        commandError,
      )
      await completion
      expect(rollbackSpy.calledOnce).to.be.true
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
