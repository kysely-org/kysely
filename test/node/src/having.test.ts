import { sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

for (const dialect of DIALECTS_WITH_MSSQL) {
  describe(`${dialect}: having`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertPersons(ctx, [
        {
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
          pets: [
            { name: 'Catto 1', species: 'cat' },
            { name: 'Catto 2', species: 'cat' },
          ],
        },
        {
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
          pets: [
            { name: 'Doggo 1', species: 'dog' },
            { name: 'Doggo 2', species: 'dog' },
          ],
        },
        {
          first_name: 'Sylvester',
          last_name: 'Stallone',
          gender: 'male',
          pets: [{ name: 'Hammo 1', species: 'hamster' }],
        },
      ])
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should add a having statement', async () => {
      const petCount = sql<number | string>`count(pet.id)`

      const query = ctx.db
        .selectFrom('person')
        .select(['first_name', petCount.as('num_pets')])
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .groupBy('first_name')
        .having(petCount, '>', 1)

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "first_name", count(pet.id) as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "first_name"`,
            `having count(pet.id) > $1`,
          ],
          parameters: [1],
        },
        mysql: {
          sql: [
            'select `first_name`, count(pet.id) as `num_pets`',
            'from `person`',
            'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
            'group by `first_name`',
            'having count(pet.id) > ?',
          ],
          parameters: [1],
        },
        mssql: {
          sql: [
            `select "first_name", count(pet.id) as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "first_name"`,
            `having count(pet.id) > @1`,
          ],
          parameters: [1],
        },
        sqlite: {
          sql: [
            `select "first_name", count(pet.id) as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "first_name"`,
            `having count(pet.id) > ?`,
          ],
          parameters: [1],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(2)

      if (dialect === 'mssql' || dialect === 'sqlite') {
        expect(result).to.containSubset([
          { first_name: 'Jennifer', num_pets: 2 },
          { first_name: 'Arnold', num_pets: 2 },
        ])
      } else {
        expect(result).to.containSubset([
          { first_name: 'Jennifer', num_pets: '2' },
          { first_name: 'Arnold', num_pets: '2' },
        ])
      }
    })

    it('should use an aggregate function in a having statement', async () => {
      const { count } = ctx.db.fn

      const query = ctx.db
        .selectFrom('person')
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select(['person.id', count<string | number>('pet.id').as('num_pets')])
        .groupBy('person.id')
        .having(count('pet.id'), '>', 1)

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "person"."id", count("pet"."id") as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "person"."id"`,
            `having count("pet"."id") > $1`,
          ],
          parameters: [1],
        },
        mysql: {
          sql: [
            'select `person`.`id`, count(`pet`.`id`) as `num_pets`',
            'from `person`',
            'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
            'group by `person`.`id`',
            'having count(`pet`.`id`) > ?',
          ],
          parameters: [1],
        },
        mssql: {
          sql: [
            `select "person"."id", count("pet"."id") as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "person"."id"`,
            `having count("pet"."id") > @1`,
          ],
          parameters: [1],
        },
        sqlite: {
          sql: [
            `select "person"."id", count("pet"."id") as "num_pets"`,
            `from "person"`,
            `inner join "pet" on "pet"."owner_id" = "person"."id"`,
            `group by "person"."id"`,
            `having count("pet"."id") > ?`,
          ],
          parameters: [1],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(2)

      if (dialect === 'mssql' || dialect === 'sqlite') {
        expect(result).to.containSubset([{ num_pets: 2 }, { num_pets: 2 }])
      } else {
        expect(result).to.containSubset([{ num_pets: '2' }, { num_pets: '2' }])
      }
    })

    it('smoke test for all *having* methods', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .groupBy('first_name')
        .having((eb) =>
          eb.or([
            eb('id', 'in', [1, 2, 3]),
            eb('first_name', '<', 'foo'),
            eb('first_name', '=', eb.ref('first_name')),
          ])
        )
        .havingRef('first_name', '=', 'first_name')
        .having((eb) => eb.not(eb.exists(eb.selectFrom('pet').select('id'))))

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person" group by "first_name" having ("id" in ($1, $2, $3) or "first_name" < $4 or "first_name" = "first_name") and "first_name" = "first_name" and not exists (select "id" from "pet")`,
          parameters: [1, 2, 3, 'foo'],
        },
        mysql: {
          sql: 'select * from `person` group by `first_name` having (`id` in (?, ?, ?) or `first_name` < ? or `first_name` = `first_name`) and `first_name` = `first_name` and not exists (select `id` from `pet`)',
          parameters: [1, 2, 3, 'foo'],
        },
        mssql: {
          sql: `select * from "person" group by "first_name" having ("id" in (@1, @2, @3) or "first_name" < @4 or "first_name" = "first_name") and "first_name" = "first_name" and not exists (select "id" from "pet")`,
          parameters: [1, 2, 3, 'foo'],
        },
        sqlite: {
          sql: `select * from "person" group by "first_name" having ("id" in (?, ?, ?) or "first_name" < ? or "first_name" = "first_name") and "first_name" = "first_name" and not exists (select "id" from "pet")`,
          parameters: [1, 2, 3, 'foo'],
        },
      })
    })
  })
}
