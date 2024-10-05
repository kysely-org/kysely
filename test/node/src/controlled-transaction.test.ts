import * as sinon from 'sinon'
import { Connection } from 'tedious'
import { CompiledQuery, IsolationLevel, Kysely } from '../../../'
import {
  DIALECTS,
  Database,
  TestContext,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  limit,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: controlled transaction`, () => {
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

    before(async function () {
      ctx = await initTest(this, dialect, (event) => {
        if (event.level === 'query') {
          executedQueries.push(event.query)
        }
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

      if (dialect == 'postgres') {
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
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'commit', parameters: [] },
        ])
      } else if (dialect === 'mysql') {
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
      } else if (dialect === 'mssql') {
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
    })

    it('should be able to start and rollback a transaction', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.rollback().execute()

      if (dialect == 'postgres') {
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
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
            parameters: ['Foo', 'Barson', 'male'],
          },
          { sql: 'rollback', parameters: [] },
        ])
      } else if (dialect === 'mysql') {
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
      } else if (dialect === 'mssql') {
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

    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'mssql') {
      for (const isolationLevel of [
        'read uncommitted',
        'read committed',
        'repeatable read',
        'serializable',
        ...(dialect === 'mssql' ? (['snapshot'] as const) : []),
      ] satisfies IsolationLevel[]) {
        it(`should set the transaction isolation level as "${isolationLevel}"`, async () => {
          const trx = await ctx.db
            .startTransaction()
            .setIsolationLevel(isolationLevel)
            .execute()

          await trx
            .insertInto('person')
            .values({
              first_name: 'Foo',
              last_name: 'Barson',
              gender: 'male',
            })
            .execute()

          await trx.commit().execute()
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

      if (dialect == 'postgres') {
        expect(
          executedQueries.map((it) => ({
            sql: it.sql,
            parameters: it.parameters,
          })),
        ).to.eql([
          { sql: 'begin', parameters: [] },
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
          { sql: 'commit', parameters: [] },
        ])
      } else if (dialect === 'mysql') {
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
      } else if (dialect === 'mssql') {
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

    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'sqlite') {
      it('should be able to savepoint and release savepoint', async () => {
        const trx = await ctx.db.startTransaction().execute()

        await insertSomething(trx)

        const trxAfterFoo = await trx.savepoint('foo').execute()

        await insertSomethingElse(trxAfterFoo)

        await trxAfterFoo.releaseSavepoint('foo').execute()

        await trxAfterFoo.commit().execute()

        if (dialect == 'postgres') {
          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql([
            { sql: 'begin', parameters: [] },
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
            { sql: 'commit', parameters: [] },
          ])
        } else if (dialect === 'mysql') {
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

    it('should throw an error when trying to execute a query after the transaction has been committed', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.commit().execute()

      await expect(insertSomethingElse(trx)).to.be.rejected
    })

    it('should throw an error when trying to execute a query after the transaction has been rolled back', async () => {
      const trx = await ctx.db.startTransaction().execute()

      await insertSomething(trx)

      await trx.rollback().execute()

      await expect(insertSomethingElse(trx)).to.be.rejected
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
}
