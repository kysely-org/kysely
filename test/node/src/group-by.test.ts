import { sql } from '../../../'

import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: group by`, () => {
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

    it('group by one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', sql`max(first_name)`.as('max_first_name')])
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

    it('group by selection', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender as g', sql`max(first_name)`.as('max_first_name')])
        .groupBy('g')
        .orderBy('g')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "gender" as "g", max(first_name) as "max_first_name" from "person" group by "g" order by "g"',
          parameters: [],
        },
        mysql: {
          sql: 'select `gender` as `g`, max(first_name) as `max_first_name` from `person` group by `g` order by `g`',
          parameters: [],
        },
        sqlite: {
          sql: 'select "gender" as "g", max(first_name) as "max_first_name" from "person" group by "g" order by "g"',
          parameters: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.containSubset([
        {
          max_first_name: 'Jennifer',
          g: 'female',
        },
        {
          max_first_name: 'Sylvester',
          g: 'male',
        },
      ])
    })

    it('group by two columns', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', sql`max(first_name)`.as('max_first_name')])
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
        .select(['gender', sql`max(first_name)`.as('max_first_name')])
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
        .select(['gender', sql`max(first_name)`.as('max_first_name')])
        .groupBy(sql`person.gender`)
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
        .select(sql`max(first_name)`.as('max_first_name'))
        .groupBy((qb) =>
          qb
            .selectFrom('pet')
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

    it('conditional group by', async () => {
      const filterByPetCount = true
      const { count } = ctx.db.fn

      // Insert another pet for Arnold.
      await ctx.db
        .insertInto('pet')
        .values({
          name: 'Doggo 2',
          species: 'dog',
          owner_id: ctx.db
            .selectFrom('person')
            .select('id')
            .where('first_name', '=', 'Arnold'),
        })
        .execute()

      const result = await ctx.db
        .selectFrom('person')
        .select('person.first_name')
        .$if(filterByPetCount, (qb) =>
          qb
            .innerJoin('pet', 'pet.owner_id', 'person.id')
            .having(count('pet.id'), '>', 1)
            .groupBy('person.first_name')
        )
        .execute()

      expect(result).to.eql([{ first_name: 'Arnold' }])
    })
  })
}
