import Database from 'better-sqlite3'
import {
  CamelCasePlugin,
  CompiledQuery,
  DeleteResult,
  InsertResult,
  Kysely,
  KyselyPlugin,
  NoResultError,
  PluginSyncNotSupportedError,
  QueryNode,
  sql,
  SqliteDialect,
  SyncNotSupportedError,
  UpdateResult,
} from '../../../'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  expect,
  initTest,
  insertDefaultDataSet,
  TestContext,
} from './test-setup.js'

describe('sqlite: sync execution', () => {
  let ctx: TestContext

  before(async function () {
    ctx = await initTest(this, 'sqlite')
  })

  beforeEach(async () => {
    await insertDefaultDataSet(ctx)
  })

  afterEach(async () => {
    await clearDatabase(ctx)
  })

  after(async () => {
    await destroyTest(ctx)
  })

  describe('SelectQueryBuilder', () => {
    it('should execute a select query synchronously', () => {
      const result = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')
        .executeSync()

      expect(result).to.have.length(3)
      expect(result[0].first_name).to.equal('Arnold')
      expect(result[1].first_name).to.equal('Jennifer')
      expect(result[2].first_name).to.equal('Sylvester')
    })

    it('should return first result with executeTakeFirstSync', () => {
      const result = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')
        .executeTakeFirstSync()

      expect(result).to.not.be.undefined
      expect(result!.first_name).to.equal('Arnold')
    })

    it('should return undefined from executeTakeFirstSync when no result', () => {
      const result = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('id', '=', 99999999)
        .executeTakeFirstSync()

      expect(result).to.be.undefined
    })

    it('should return first result with executeTakeFirstOrThrowSync', () => {
      const result = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')
        .executeTakeFirstOrThrowSync()

      expect(result.first_name).to.equal('Arnold')
    })

    it('should throw NoResultError from executeTakeFirstOrThrowSync when no result', () => {
      try {
        ctx.db
          .selectFrom('person')
          .selectAll()
          .where('id', '=', 99999999)
          .executeTakeFirstOrThrowSync()

        throw new Error('should not get here')
      } catch (error) {
        expect(error instanceof NoResultError).to.equal(true)
      }
    })

    it('should throw custom error constructor from executeTakeFirstOrThrowSync', () => {
      class MyNotFoundError extends Error {
        node: QueryNode

        constructor(node: QueryNode) {
          super('custom error')
          this.node = node
        }
      }

      try {
        ctx.db
          .selectFrom('person')
          .selectAll()
          .where('id', '=', 99999999)
          .executeTakeFirstOrThrowSync(MyNotFoundError)

        throw new Error('should not get here')
      } catch (error) {
        expect(error instanceof MyNotFoundError).to.equal(true)

        if (error instanceof MyNotFoundError) {
          expect(error.node.kind).to.equal('SelectQueryNode')
        }
      }
    })

    it('should throw custom error from function in executeTakeFirstOrThrowSync', () => {
      const message = 'my custom error'
      const customError = new Error(message)

      try {
        ctx.db
          .selectFrom('person')
          .selectAll()
          .where('id', '=', 99999999)
          .executeTakeFirstOrThrowSync(() => customError)

        throw new Error('should not get here')
      } catch (error: any) {
        expect(error.message).to.equal(message)
      }
    })
  })

  describe('InsertQueryBuilder', () => {
    it('should execute an insert query synchronously', () => {
      const result = ctx.db
        .insertInto('person')
        .values({
          first_name: 'New',
          last_name: 'Person',
          gender: 'other',
        })
        .executeTakeFirstSync()

      expect(result).to.be.instanceOf(InsertResult)
      expect(result!.insertId).to.be.a('bigint')
    })
  })

  describe('UpdateQueryBuilder', () => {
    it('should execute an update query synchronously', () => {
      const result = ctx.db
        .updateTable('person')
        .set({ last_name: 'Updated' })
        .where('first_name', '=', 'Jennifer')
        .executeTakeFirstSync()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result!.numUpdatedRows).to.equal(1n)
    })
  })

  describe('DeleteQueryBuilder', () => {
    it('should execute a delete query synchronously', () => {
      const result = ctx.db
        .deleteFrom('pet')
        .where('name', '=', 'Catto')
        .executeTakeFirstSync()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result!.numDeletedRows).to.be.a('bigint')
    })
  })

  describe('Kysely.executeQuerySync', () => {
    it('should execute a compiled query synchronously', () => {
      const compiledQuery = CompiledQuery.raw('select 1 as count')

      const result = ctx.db.executeQuerySync(compiledQuery)

      expect(result.rows).to.have.length(1)
      expect(result.rows[0]).to.deep.equal({ count: 1 })
    })

    it('should compile and execute a query builder synchronously', () => {
      const query = ctx.db.selectFrom('person').selectAll()

      const result = ctx.db.executeQuerySync(query)

      expect(result.rows).to.have.length(3)
    })
  })

  describe('InsertQueryBuilder with returning', () => {
    it('should execute insert with returning synchronously', () => {
      const result = ctx.db
        .insertInto('person')
        .values({ first_name: 'Test', last_name: 'Person', gender: 'other' })
        .returning(['id', 'first_name'])
        .executeSync()

      expect(result).to.have.length(1)
      expect(result[0].first_name).to.equal('Test')
      expect(result[0].id).to.be.a('number')
    })
  })

  describe('UpdateQueryBuilder with returning', () => {
    it('should execute update with returning synchronously', () => {
      const result = ctx.db
        .updateTable('person')
        .set({ last_name: 'Updated' })
        .where('first_name', '=', 'Jennifer')
        .returning(['first_name', 'last_name'])
        .executeSync()

      expect(result).to.have.length(1)
      expect(result[0].last_name).to.equal('Updated')
    })
  })

  describe('DeleteQueryBuilder with returning', () => {
    it('should execute delete with returning synchronously', () => {
      const result = ctx.db
        .deleteFrom('pet')
        .where('name', '=', 'Catto')
        .returning('name')
        .executeSync()

      expect(result).to.have.length(1)
      expect(result[0].name).to.equal('Catto')
    })
  })

  describe('RawBuilder', () => {
    it('should execute raw query synchronously', () => {
      const result = sql`select first_name from person where first_name = ${'Jennifer'}`.executeSync(
        ctx.db,
      )

      expect(result.rows).to.have.length(1)
    })
  })

  describe('plugin integration', () => {
    it('should throw PluginSyncNotSupportedError when plugin lacks transformResultSync', () => {
      const badPlugin: KyselyPlugin = {
        transformQuery: (args) => args.node,
        transformResult: async (args) => args.result,
      }

      const dbWithBadPlugin = ctx.db.withPlugin(badPlugin)

      try {
        dbWithBadPlugin.selectFrom('person').selectAll().executeSync()
        throw new Error('should not get here')
      } catch (error) {
        expect(error instanceof PluginSyncNotSupportedError).to.equal(true)
      }
    })

    it('should work with CamelCasePlugin synchronously', async () => {
      const dbWithCamelCase = new Kysely<any>({
        dialect: new SqliteDialect({
          database: new Database(':memory:'),
        }),
        plugins: [new CamelCasePlugin()],
      })

      await sql`CREATE TABLE test_table (first_name TEXT)`.execute(
        dbWithCamelCase,
      )
      await sql`INSERT INTO test_table VALUES ('Test')`.execute(dbWithCamelCase)

      const result = dbWithCamelCase.executeQuerySync<{ firstName: string }>(
        CompiledQuery.raw('SELECT first_name FROM test_table'),
      )

      expect(result.rows[0].firstName).to.equal('Test')

      await dbWithCamelCase.destroy()
    })
  })

  describe('synchronous initialization', () => {
    it('should auto-initialize when executeSync is called first', async () => {
      const freshDb = new Kysely<any>({
        dialect: new SqliteDialect({
          database: new Database(':memory:'),
        }),
      })

      try {
        freshDb.executeQuerySync(
          CompiledQuery.raw('CREATE TABLE test (id INTEGER PRIMARY KEY)'),
        )
        freshDb.executeQuerySync(CompiledQuery.raw('INSERT INTO test VALUES (1)'))

        const result = freshDb.executeQuerySync<{ id: number }>(
          CompiledQuery.raw('SELECT * FROM test'),
        )

        expect(result.rows).to.have.length(1)
        expect(result.rows[0].id).to.equal(1)
      } finally {
        await freshDb.destroy()
      }
    })

    it('should throw when database is provided as factory function', async () => {
      const dbWithFactory = new Kysely<any>({
        dialect: new SqliteDialect({
          database: async () => new Database(':memory:'),
        }),
      })

      try {
        dbWithFactory.selectFrom('person').selectAll().executeSync()
        throw new Error('should not get here')
      } catch (error: any) {
        expect(error.message).to.include('factory function')
      } finally {
        await dbWithFactory.destroy()
      }
    })

    it('should throw when onCreateConnection hook is provided', async () => {
      const dbWithHook = new Kysely<any>({
        dialect: new SqliteDialect({
          database: new Database(':memory:'),
          onCreateConnection: async () => {},
        }),
      })

      try {
        dbWithHook.selectFrom('person').selectAll().executeSync()
        throw new Error('should not get here')
      } catch (error: any) {
        expect(error.message).to.include('onCreateConnection')
      } finally {
        await dbWithHook.destroy()
      }
    })
  })

  describe('sync execution in transactions', () => {
    it('should execute sync select within a transaction', async () => {
      await ctx.db.transaction().execute(async (trx) => {
        const result = trx
          .selectFrom('person')
          .selectAll()
          .orderBy('first_name')
          .executeSync()

        expect(result).to.have.length(3)
        expect(result[0].first_name).to.equal('Arnold')
      })
    })

    it('should execute sync insert within a transaction', async () => {
      await ctx.db.transaction().execute(async (trx) => {
        const result = trx
          .insertInto('person')
          .values({ first_name: 'Sync', last_name: 'Test', gender: 'other' })
          .returning('first_name')
          .executeTakeFirstSync()

        expect(result).to.not.be.undefined
        expect(result!.first_name).to.equal('Sync')
      })

      // Verify the insert was committed
      const person = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Sync')
        .executeTakeFirstSync()

      expect(person).to.not.be.undefined
      expect(person!.first_name).to.equal('Sync')
    })

    it('should rollback sync changes on transaction error', async () => {
      try {
        await ctx.db.transaction().execute(async (trx) => {
          trx
            .insertInto('person')
            .values({ first_name: 'Rollback', last_name: 'Test', gender: 'other' })
            .executeTakeFirstSync()

          throw new Error('force rollback')
        })
      } catch {
        // Expected
      }

      // Verify the insert was rolled back
      const person = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Rollback')
        .executeTakeFirstSync()

      expect(person).to.be.undefined
    })

    it('should work with controlled transactions', async () => {
      const trx = await ctx.db.startTransaction().execute()

      try {
        const result = trx
          .selectFrom('person')
          .selectAll()
          .orderBy('first_name')
          .executeSync()

        expect(result).to.have.length(3)

        trx
          .insertInto('person')
          .values({ first_name: 'Controlled', last_name: 'Sync', gender: 'other' })
          .executeTakeFirstSync()

        await trx.commit().execute()
      } catch {
        await trx.rollback().execute()
        throw new Error('should not get here')
      }

      // Verify the insert was committed
      const person = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Controlled')
        .executeTakeFirstSync()

      expect(person).to.not.be.undefined
    })

    it('should execute sync update within a transaction', async () => {
      await ctx.db.transaction().execute(async (trx) => {
        const result = trx
          .updateTable('person')
          .set({ last_name: 'TransactionUpdated' })
          .where('first_name', '=', 'Jennifer')
          .executeTakeFirstSync()

        expect(result!.numUpdatedRows).to.equal(1n)
      })

      // Verify the update was committed
      const person = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Jennifer')
        .executeTakeFirstSync()

      expect(person!.last_name).to.equal('TransactionUpdated')
    })

    it('should execute sync delete within a transaction', async () => {
      await ctx.db.transaction().execute(async (trx) => {
        const result = trx
          .deleteFrom('pet')
          .where('name', '=', 'Catto')
          .executeTakeFirstSync()

        expect(result!.numDeletedRows).to.be.a('bigint')
      })

      // Verify the delete was committed
      const pet = ctx.db
        .selectFrom('pet')
        .selectAll()
        .where('name', '=', 'Catto')
        .executeTakeFirstSync()

      expect(pet).to.be.undefined
    })
  })
})

for (const dialect of DIALECTS.filter((d) => d !== 'sqlite')) {
  describe(`${dialect}: sync execution errors`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should throw SyncNotSupportedError', () => {
      try {
        ctx.db.selectFrom('person').selectAll().executeSync()
        throw new Error('should not get here')
      } catch (error) {
        expect(error instanceof SyncNotSupportedError).to.equal(true)
      }
    })
  })
}
