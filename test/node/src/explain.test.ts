import { expect } from 'chai'
import { createSandbox, SinonSpy } from 'sinon'
import { DefaultQueryExecutor, sql } from '../../../'
import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  NOT_SUPPORTED,
  TestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
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

    it('should add explain statement before selects', async () => {
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

    it('should add explain statement before inserts', async () => {
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

    it('should add explain statement before updates', async () => {
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

    it('should add explain statement before deletes', async () => {
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
      it('should add explain statement before replaces', async () => {
        await ctx.db
          .replaceInto('person')
          .values({ id: 123, gender: 'female' })
          .explain()

        expect(executeQuerySpy.calledOnce).to.be.true
        expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
          'explain replace into `person` (`id`, `gender`) values (?, ?)'
        )
      })
    }

    if (dialect === 'postgres') {
      it('should add explain statement before select, with analyze', async () => {
        await ctx.db
          .selectFrom('person')
          .where('id', '=', 123)
          .selectAll()
          .explain('json', sql`analyze`)

        expect(executeQuerySpy.calledOnce).to.be.true
        expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
          {
            postgres:
              'explain (analyze, format json) select * from "person" where "id" = $1',
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          }[dialect]
        )
      })
    }

    if (dialect === 'mysql') {
      it('should add explain statement before select, with analyze', async () => {
        await ctx.db
          .selectFrom('person')
          .where('id', '=', 123)
          .selectAll()
          .explain('tree', sql`analyze`)

        expect(executeQuerySpy.calledOnce).to.be.true
        expect(executeQuerySpy.getCall(0).args[0].sql).to.equal(
          {
            postgres: NOT_SUPPORTED,
            mysql:
              'explain analyze format=tree select * from `person` where `id` = ?',
            sqlite: NOT_SUPPORTED,
          }[dialect]
        )
      })
    }
  })
}
