import { HandleEmptyInsertValuesPlugin } from '../../../dist/index.js'
import {
  destroyTest,
  initTest,
  type TestContext,
  testSql,
  expect,
  DIALECTS,
  insertDefaultDataSet,
  clearDatabase,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { variant } = dialect

  describe(`${variant}: handle empty insert values plugin`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect, {
        plugins: [new HandleEmptyInsertValuesPlugin()],
      })
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

    it('should handle `insert into t values ()` via .values({})', async () => {
      const query = ctx.db.insertInto('person').values({} as any)

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
        mysql: {
          sql: 'insert into `person` select * from `person` where 1 = 0',
          parameters: [],
        },
        mssql: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
        sqlite: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result.numInsertedOrUpdatedRows).to.equal(0n)
    })

    it('should handle `insert into t values ()` via .values([{}, {}])', async () => {
      const query = ctx.db.insertInto('person').values([{}, {}] as any)

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
        mysql: {
          sql: 'insert into `person` select * from `person` where 1 = 0',
          parameters: [],
        },
        mssql: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
        sqlite: {
          sql: 'insert into "person" select * from "person" where 1 = 0',
          parameters: [],
        },
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result.numInsertedOrUpdatedRows).to.equal(0n)
    })

    it('should not affect non-empty inserts', async () => {
      const query = ctx.db
        .insertInto('person')
        .values({ first_name: 'Test', last_name: 'User', gender: 'other' })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
          parameters: ['Test', 'User', 'other'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
          parameters: ['Test', 'User', 'other'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
          parameters: ['Test', 'User', 'other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
          parameters: ['Test', 'User', 'other'],
        },
      })
    })
  })
}
