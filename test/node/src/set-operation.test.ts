import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  insertDefaultDataSet,
  NOT_SUPPORTED,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: set operations`, () => {
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

    it('should combine two select queries using union', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name as name'])
        .union(ctx.db.selectFrom('pet').select(['id', 'name']))
        .orderBy('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "id", "first_name" as "name" from "person" union select "id", "name" from "pet" order by "name"',
          parameters: [],
        },
        mysql: {
          sql: 'select `id`, `first_name` as `name` from `person` union select `id`, `name` from `pet` order by `name`',
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select "id", "first_name" as "name" from "person" union select "id", "name" from "pet" order by "name"',
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

    if (dialect === 'postgres' || dialect === 'mysql') {
      it('should combine three select queries using union and an expression builder', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .union((eb) =>
            eb.parens(
              eb
                .selectFrom('pet')
                .select(['id', 'name'])
                .union(eb.selectFrom('toy').select(['id', 'name']))
            )
          )
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" union (select "id", "name" from "pet" union select "id", "name" from "toy") order by "name"',
            parameters: [],
          },
          mysql: {
            sql: 'select `id`, `first_name` as `name` from `person` union (select `id`, `name` from `pet` union select `id`, `name` from `toy`) order by `name`',
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
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
    }

    it('should combine two select queries using union all', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name as name'])
        .unionAll(ctx.db.selectFrom('pet').select(['id', 'name']))
        .orderBy('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "id", "first_name" as "name" from "person" union all select "id", "name" from "pet" order by "name"',
          parameters: [],
        },
        mysql: {
          sql: 'select `id`, `first_name` as `name` from `person` union all select `id`, `name` from `pet` order by `name`',
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select "id", "first_name" as "name" from "person" union all select "id", "name" from "pet" order by "name"',
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

    it('should combine three select queries using union and union all', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name as name'])
        .unionAll(ctx.db.selectFrom('pet').select(['id', 'name']))
        .union(ctx.db.selectFrom('toy').select(['id', 'name']))
        .orderBy('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "id", "first_name" as "name" from "person" union all select "id", "name" from "pet" union select "id", "name" from "toy" order by "name"',
          parameters: [],
        },
        mysql: {
          sql: 'select `id`, `first_name` as `name` from `person` union all select `id`, `name` from `pet` union select `id`, `name` from `toy` order by `name`',
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select "id", "first_name" as "name" from "person" union all select "id", "name" from "pet" union select "id", "name" from "toy" order by "name"',
          parameters: [],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should combine two select queries using intersect', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .intersect(ctx.db.selectFrom('pet').select(['id', 'name']))
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" intersect select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'select "id", "first_name" as "name" from "person" intersect select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
        })

        await query.execute()
      })

      it('should combine two select queries using except', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .except(ctx.db.selectFrom('pet').select(['id', 'name']))
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" except select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'select "id", "first_name" as "name" from "person" except select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
        })

        await query.execute()
      })

      it('should combine three queries using union, union all, intersect and except', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .union(ctx.db.selectFrom('pet').select(['id', 'name']))
          .unionAll(ctx.db.selectFrom('toy').select(['id', 'name']))
          .intersect(ctx.db.selectFrom('pet').select(['id', 'name']))
          .except(ctx.db.selectFrom('toy').select(['id', 'name']))
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" union select "id", "name" from "pet" union all select "id", "name" from "toy" intersect select "id", "name" from "pet" except select "id", "name" from "toy" order by "name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'select "id", "first_name" as "name" from "person" union select "id", "name" from "pet" union all select "id", "name" from "toy" intersect select "id", "name" from "pet" except select "id", "name" from "toy" order by "name"',
            parameters: [],
          },
        })

        await query.execute()
      })
    }

    if (dialect === 'postgres') {
      it('should combine two select queries using intersect all', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .intersectAll(ctx.db.selectFrom('pet').select(['id', 'name']))
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" intersect all select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should combine two select queries using except all', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(['id', 'first_name as name'])
          .exceptAll(ctx.db.selectFrom('pet').select(['id', 'name']))
          .orderBy('name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "id", "first_name" as "name" from "person" except all select "id", "name" from "pet" order by "name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }
  })
}
