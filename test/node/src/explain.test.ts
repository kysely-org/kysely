import { ExplainPlugin } from '../../../dist/cjs'
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

    before(async function () {
      ctx = await initTest(this, dialect)
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

    it('should add explain statement before selects', async () => {
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

    it('should add explain statement before inserts', async () => {
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

    it('should add explain statement before updates', async () => {
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

    it('should add explain statement before deletes', async () => {
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

    if (dialect === 'mysql') {
      it('should add explain statement before replaces', async () => {
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
    }
  })
}
