import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: union`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
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

    it('should combine two select queries using union', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name as name'])
        .union(ctx.db.selectFrom('pet').select(['id', 'name']))
        .orderBy('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "id", "first_name" as "name" from "person" union (select "id", "name" from "pet") order by "name"',
          parameters: [],
        },
        mysql: {
          sql: 'select `id`, `first_name` as `name` from `person` union (select `id`, `name` from `pet`) order by `name`',
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.containSubset([
        { name: 'Arnold' },
        { name: 'Catto' },
        { name: 'Doggo' },
        { name: 'Hammo' },
        { name: 'Jennifer' },
        { name: 'Sylvester' },
      ])
    })

    it('should combine two select queries using union all', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name as name'])
        .unionAll(ctx.db.selectFrom('pet').select(['id', 'name']))
        .orderBy('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "id", "first_name" as "name" from "person" union all (select "id", "name" from "pet") order by "name"',
          parameters: [],
        },
        mysql: {
          sql: 'select `id`, `first_name` as `name` from `person` union all (select `id`, `name` from `pet`) order by `name`',
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.containSubset([
        { name: 'Arnold' },
        { name: 'Catto' },
        { name: 'Doggo' },
        { name: 'Hammo' },
        { name: 'Jennifer' },
        { name: 'Sylvester' },
      ])
    })
  })
}
