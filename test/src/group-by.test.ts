import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: group by`, () => {
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

    it('group by one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', ctx.db.raw('max(first_name)').as('max_first_name')])
        .groupBy('gender')
        .orderBy('gender')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "gender" order by "gender"',
          parameters: [],
        },
        mysql: {
          sql: 'select `gender`, max(first_name) as `max_first_name` from `person` group by `gender` order by `gender`',
          parameters: [],
        },
        sqlite: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "gender" order by "gender"',
          parameters: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.containSubset([
        {
          max_first_name: 'Jennifer',
          gender: 'female',
        },
        {
          max_first_name: 'Sylvester',
          gender: 'male',
        },
      ])
    })

    it('group by two columns', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', ctx.db.raw('max(first_name)').as('max_first_name')])
        .groupBy(['gender', 'id'])
        .orderBy('gender')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "gender", "id" order by "gender"',
          parameters: [],
        },
        mysql: {
          sql: 'select `gender`, max(first_name) as `max_first_name` from `person` group by `gender`, `id` order by `gender`',
          parameters: [],
        },
        sqlite: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "gender", "id" order by "gender"',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('group by a reference', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', ctx.db.raw('max(first_name)').as('max_first_name')])
        .groupBy('person.gender')
        .orderBy('gender', 'asc')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "person"."gender" order by "gender" asc',
          parameters: [],
        },
        mysql: {
          sql: 'select `gender`, max(first_name) as `max_first_name` from `person` group by `person`.`gender` order by `gender` asc',
          parameters: [],
        },
        sqlite: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by "person"."gender" order by "gender" asc',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('group by a raw expression', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', ctx.db.raw('max(first_name)').as('max_first_name')])
        .groupBy(ctx.db.raw('person.gender'))
        .orderBy('gender', 'asc')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by person.gender order by "gender" asc',
          parameters: [],
        },
        mysql: {
          sql: 'select `gender`, max(first_name) as `max_first_name` from `person` group by person.gender order by `gender` asc',
          parameters: [],
        },
        sqlite: {
          sql: 'select "gender", max(first_name) as "max_first_name" from "person" group by person.gender order by "gender" asc',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('group by a sub query', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(ctx.db.raw('max(first_name)').as('max_first_name'))
        .groupBy((qb) =>
          qb
            .subQuery('pet')
            .whereRef('person.id', '=', 'pet.owner_id')
            .select('pet.name')
        )
        .orderBy('max_first_name')

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select max(first_name) as "max_first_name"',
            'from "person"',
            'group by (select "pet"."name" from "pet" where "person"."id" = "pet"."owner_id")',
            'order by "max_first_name"',
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select max(first_name) as `max_first_name`',
            'from `person`',
            'group by (select `pet`.`name` from `pet` where `person`.`id` = `pet`.`owner_id`)',
            'order by `max_first_name`',
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            'select max(first_name) as "max_first_name"',
            'from "person"',
            'group by (select "pet"."name" from "pet" where "person"."id" = "pet"."owner_id")',
            'order by "max_first_name"',
          ],
          parameters: [],
        },
      })

      await query.execute()
    })
  })
}
