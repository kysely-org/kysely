import * as sinon from 'sinon'
import { Connection, ISOLATION_LEVEL } from 'tedious'
import {
  CompiledQuery,
  ControlledTransaction,
  type Driver,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
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
  const sandbox = sinon.createSandbox()
  let driver: Driver
  let db: Kysely<Database>
  let acquireStub: sinon.SinonStub
  let querySpy: sinon.SinonSpy
  let releaseSpy: sinon.SinonSpy

  beforeEach(async () => {
    driver = new DummyDriver()
    const connection = await driver.acquireConnection()
    acquireStub = sandbox.stub(driver, 'acquireConnection').resolves(connection)
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
  })

  afterEach(async () => {
    sandbox.restore()
    await db.destroy()
  })

  it('should throw an error when trying to savepoint on a dialect that does not support it', async () => {
    sandbox.stub(driver, 'savepoint').value(undefined)
    const trx = await db.startTransaction().execute()

    await expect(trx.savepoint('foo').execute()).to.be.rejectedWith(
      'The `savepoint` method is not supported by this driver',
    )

    await trx.rollback().execute()
  })

  it('should throw an error when trying to rollback to a savepoint on a dialect that does not support it', async () => {
    sandbox.stub(driver, 'rollbackToSavepoint').value(undefined)
    const trx = await db.startTransaction().execute()

    await expect(
      trx.rollbackToSavepoint('foo' as never).execute(),
    ).to.be.rejectedWith(
      'The `rollbackToSavepoint` method is not supported by this driver',
    )

    await trx.rollback().execute()
  })

  it('should throw an error when trying to release a savepoint on a dialect that does not support it', async () => {
    sandbox.stub(driver, 'releaseSavepoint').value(undefined)
    const trx = await db.startTransaction().execute()

    await expect(
      trx.releaseSavepoint('foo' as never).execute(),
    ).to.be.rejectedWith(
      'The `releaseSavepoint` method is not supported by this driver',
    )

    await trx.rollback().execute()
  })

  it('should release the connection if the transaction fails to begin', async () => {
    const beginError = new Error('begin failed')
    sandbox.stub(driver, 'beginTransaction').rejects(beginError)

    const error = await db
      .startTransaction()
      .execute()
      .catch((error: unknown) => error)

    expect(error).to.equal(beginError)
    expect(acquireStub.calledOnce, 'connection acquired once').to.be.true
    expect(releaseSpy.calledOnce, 'connection released once').to.be.true
    expect(releaseSpy.firstCall.args[0]).to.equal(
      await acquireStub.firstCall.returnValue,
    )
  })

  it('should invalidate derived handles when the original transaction commits', async () => {
    const trx = await db.startTransaction().execute()
    const derivedTrx = trx.withSchema('public')
    const savepointTrx = await trx.savepoint('point').execute()

    await trx.commit().execute()

    expect(derivedTrx.isCommitted).to.be.true
    expect(derivedTrx.isRolledBack).to.be.false
    expect(savepointTrx.isCommitted).to.be.true
    expect(savepointTrx.isRolledBack).to.be.false
    await expect(
      derivedTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    await expect(
      savepointTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    expect(() => derivedTrx.commit()).to.throw(
      'Transaction is already committed',
    )
    expect(() => derivedTrx.rollback()).to.throw(
      'Transaction is already committed',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate the original transaction when a derived handle commits', async () => {
    const trx = await db.startTransaction().execute()
    const derivedTrx = trx.withSchema('public')
    const savepointTrx = await trx.savepoint('point').execute()

    await derivedTrx.commit().execute()

    expect(trx.isCommitted).to.be.true
    expect(trx.isRolledBack).to.be.false
    expect(savepointTrx.isCommitted).to.be.true
    expect(savepointTrx.isRolledBack).to.be.false
    await expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    await expect(
      savepointTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already committed')
    expect(() => trx.commit()).to.throw('Transaction is already committed')
    expect(() => trx.rollback()).to.throw('Transaction is already committed')
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate derived handles when the original transaction rolls back', async () => {
    const trx = await db.startTransaction().execute()
    const derivedTrx = trx.withSchema('public')
    const savepointTrx = await trx.savepoint('point').execute()

    await trx.rollback().execute()

    expect(derivedTrx.isCommitted).to.be.false
    expect(derivedTrx.isRolledBack).to.be.true
    expect(savepointTrx.isCommitted).to.be.false
    expect(savepointTrx.isRolledBack).to.be.true
    await expect(
      derivedTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    await expect(
      savepointTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    expect(() => derivedTrx.commit()).to.throw(
      'Transaction is already rolled back',
    )
    expect(() => derivedTrx.rollback()).to.throw(
      'Transaction is already rolled back',
    )
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })

  it('should invalidate the original transaction when a derived handle rolls back', async () => {
    const trx = await db.startTransaction().execute()
    const derivedTrx = trx.withSchema('public')
    const savepointTrx = await trx.savepoint('point').execute()

    await derivedTrx.rollback().execute()

    expect(trx.isCommitted).to.be.false
    expect(trx.isRolledBack).to.be.true
    expect(savepointTrx.isCommitted).to.be.false
    expect(savepointTrx.isRolledBack).to.be.true
    await expect(
      trx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    await expect(
      savepointTrx.selectFrom('person').selectAll().execute(),
    ).to.be.rejectedWith('Transaction is already rolled back')
    expect(() => trx.commit()).to.throw('Transaction is already rolled back')
    expect(() => trx.rollback()).to.throw('Transaction is already rolled back')
    expect(querySpy.notCalled).to.be.true
    expect(releaseSpy.calledOnce).to.be.true
  })
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
