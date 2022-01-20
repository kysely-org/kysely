import { DeduplicateJoinsPlugin } from '../../..'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: deduplicate joins`, () => {
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

    it('should remove simple duplicate joins', async () => {
      const query = ctx.db
        .withPlugin(new DeduplicateJoinsPlugin())
        .selectFrom('person')
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .innerJoin('pet', 'pet.owner_id', 'person.id')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" inner join "pet" on "pet"."owner_id" = "person"."id"',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` inner join `pet` on `pet`.`owner_id` = `person`.`id`',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" inner join "pet" on "pet"."owner_id" = "person"."id"',
          parameters: [],
        },
      })
    })

    it('should remove complex duplicate joins', async () => {
      const query = ctx.db
        .withPlugin(new DeduplicateJoinsPlugin())
        .selectFrom('person')
        .innerJoin(
          ctx.db
            .selectFrom('pet')
            .select(['owner_id', 'id as pet_id', 'species'])
            .as('p'),
          (join) =>
            join
              .onRef('p.owner_id', '=', 'person.id')
              .on('p.species', 'in', ['cat', 'hamster'])
        )
        .innerJoin(
          ctx.db
            .selectFrom('pet')
            .select(['owner_id', 'id as pet_id', 'species'])
            .as('p'),
          (join) =>
            join
              .onRef('p.owner_id', '=', 'person.id')
              .on('p.species', 'in', ['cat', 'hamster'])
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" inner join (select "owner_id", "id" as "pet_id", "species" from "pet") as "p" on "p"."owner_id" = "person"."id" and "p"."species" in ($1, $2)',
          parameters: ['cat', 'hamster'],
        },
        mysql: {
          sql: 'select from `person` inner join (select `owner_id`, `id` as `pet_id`, `species` from `pet`) as `p` on `p`.`owner_id` = `person`.`id` and `p`.`species` in (?, ?)',
          parameters: ['cat', 'hamster'],
        },
        sqlite: {
          sql: 'select from "person" inner join (select "owner_id", "id" as "pet_id", "species" from "pet") as "p" on "p"."owner_id" = "person"."id" and "p"."species" in (?, ?)',
          parameters: ['cat', 'hamster'],
        },
      })
    })

    it('should not remove non-identical joins', async () => {
      const query = ctx.db
        .withPlugin(new DeduplicateJoinsPlugin())
        .selectFrom('person')
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .innerJoin('toy', 'toy.pet_id', 'pet.id')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" inner join "pet" on "pet"."owner_id" = "person"."id" inner join "toy" on "toy"."pet_id" = "pet"."id"',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` inner join `pet` on `pet`.`owner_id` = `person`.`id` inner join `toy` on `toy`.`pet_id` = `pet`.`id`',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" inner join "pet" on "pet"."owner_id" = "person"."id" inner join "toy" on "toy"."pet_id" = "pet"."id"',
          parameters: [],
        },
      })
    })
  })
}
