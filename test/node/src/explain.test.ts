import { expect } from 'chai'
import { createSandbox, SinonSpy } from 'sinon'
import { DefaultQueryExecutor, ExplainPlugin } from '../../../'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  NOT_SUPPORTED,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: explain test`, () => {
    let ctx: TestContext
    const sandbox = createSandbox()
    let executeQuerySpy: SinonSpy

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
      executeQuerySpy = sandbox.spy(
        DefaultQueryExecutor.prototype,
        'executeQuery'
      )
    })

    afterEach(async () => {
      await clearDatabase(ctx)
      sandbox.restore()
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should add explain statement before selects, when using ExplainPlugin', async () => {
      const query = ctx.db
        .withPlugin(new ExplainPlugin())
        .selectFrom('person')
        .selectAll()
        .limit(5)

      testSql(query, dialect, {
        postgres: {
          sql: 'explain select * from "person" limit $1',
          parameters: [5],
        },
        mysql: {
          sql: 'explain select * from `person` limit ?',
          parameters: [5],
        },
        sqlite: {
          sql: 'explain select * from "person" limit ?',
          parameters: [5],
        },
      })

      await query.execute()
    })

    it('should add explain statement before selects, when using explain method', async () => {
      await ctx.db.selectFrom('person').selectAll().limit(5).explain()

      expect(executeQuerySpy.calledOnce).to.be.true
      expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
        {
          postgres: 'explain select * from "person" limit $1',
          mysql: 'explain select * from `person` limit ?',
          sqlite: 'explain select * from "person" limit ?',
        }[dialect]
      )
    })

    it('should add explain statement before inserts, when using ExplainPlugin', async () => {
      const query = ctx.db
        .withPlugin(new ExplainPlugin())
        .insertInto('person')
        .values({ gender: 'female' })

      testSql(query, dialect, {
        postgres: {
          sql: 'explain insert into "person" ("gender") values ($1)',
          parameters: ['female'],
        },
        mysql: {
          sql: 'explain insert into `person` (`gender`) values (?)',
          parameters: ['female'],
        },
        sqlite: {
          sql: 'explain insert into "person" ("gender") values (?)',
          parameters: ['female'],
        },
      })

      await query.execute()
    })

    it('should add explain statement before inserts, when using explain method', async () => {
      await ctx.db.insertInto('person').values({ gender: 'female' }).explain()

      expect(executeQuerySpy.calledOnce).to.be.true
      expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
        {
          postgres: 'explain insert into "person" ("gender") values ($1)',
          mysql: 'explain insert into `person` (`gender`) values (?)',
          sqlite: 'explain insert into "person" ("gender") values (?)',
        }[dialect]
      )
    })

    it('should add explain statement before updates, when using ExplainPlugin', async () => {
      const query = ctx.db
        .withPlugin(new ExplainPlugin())
        .updateTable('person')
        .set({ gender: 'female' })
        .where('id', '=', 123)

      testSql(query, dialect, {
        postgres: {
          sql: 'explain update "person" set "gender" = $1 where "id" = $2',
          parameters: ['female', 123],
        },
        mysql: {
          sql: 'explain update `person` set `gender` = ? where `id` = ?',
          parameters: ['female', 123],
        },
        sqlite: {
          sql: 'explain update "person" set "gender" = ? where "id" = ?',
          parameters: ['female', 123],
        },
      })

      await query.execute()
    })

    it('should add explain statement before updates, when using explain method', async () => {
      await ctx.db
        .updateTable('person')
        .set({ gender: 'female' })
        .where('id', '=', 123)
        .explain()

      expect(executeQuerySpy.calledOnce).to.be.true
      expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
        {
          postgres: 'explain update "person" set "gender" = $1 where "id" = $2',
          mysql: 'explain update `person` set `gender` = ? where `id` = ?',
          sqlite: 'explain update "person" set "gender" = ? where "id" = ?',
        }[dialect]
      )
    })

    it('should add explain statement before deletes, when using ExplainPlugin', async () => {
      const query = ctx.db
        .withPlugin(new ExplainPlugin())
        .deleteFrom('person')
        .where('id', '=', 123)

      testSql(query, dialect, {
        postgres: {
          sql: 'explain delete from "person" where "id" = $1',
          parameters: [123],
        },
        mysql: {
          sql: 'explain delete from `person` where `id` = ?',
          parameters: [123],
        },
        sqlite: {
          sql: 'explain delete from "person" where "id" = ?',
          parameters: [123],
        },
      })

      await query.execute()
    })

    it('should add explain statement before deletes, when using explain method', async () => {
      await ctx.db.deleteFrom('person').where('id', '=', 123).explain()

      expect(executeQuerySpy.calledOnce).to.be.true
      expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
        {
          postgres: 'explain delete from "person" where "id" = $1',
          mysql: 'explain delete from `person` where `id` = ?',
          sqlite: 'explain delete from "person" where "id" = ?',
        }[dialect]
      )
    })

    if (dialect === 'mysql') {
      it('should add explain statement before replaces, when using ExplainPlugin', async () => {
        const query = ctx.db
          .withPlugin(new ExplainPlugin())
          .replaceInto('person')
          .values({ id: 123, gender: 'female' })

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: 'explain replace into `person` (`id`, `gender`) values (?, ?)',
            parameters: [123, 'female'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should add explain statement before replaces, when using ExplainPlugin', async () => {
        await ctx.db
          .withPlugin(new ExplainPlugin())
          .replaceInto('person')
          .values({ id: 123, gender: 'female' })
          .explain()

        expect(executeQuerySpy.calledOnce).to.be.true
        expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
          'explain replace into `person` (`id`, `gender`) values (?, ?)'
        )
      })
    }
  })
}
