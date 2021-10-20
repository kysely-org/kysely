import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: having`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
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
      const petCount = ctx.db.raw<number>('count(pet.id)')

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
          bindings: [1],
        },
        mysql: {
          sql: [
            'select `first_name`, count(pet.id) as `num_pets`',
            'from `person`',
            'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
            'group by `first_name`',
            'having count(pet.id) > ?',
          ],
          bindings: [1],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(2)
      expect(result).to.containSubset([
        { first_name: 'Jennifer', num_pets: '2' },
        { first_name: 'Arnold', num_pets: '2' },
      ])
    })

    it('smoke test for all *having* methods', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .groupBy('first_name')
        .having('id', 'in', [1, 2, 3])
        .orHaving('first_name', '<', 'foo')
        .havingRef('first_name', '=', 'first_name')
        .orHavingRef('first_name', '=', 'first_name')
        .havingExists((qb) => qb.subQuery('pet').select('id'))
        .orHavingExists((qb) => qb.subQuery('pet').select('id'))
        .havingNotExist((qb) => qb.subQuery('pet').select('id'))
        .orHavingNotExists((qb) => qb.subQuery('pet').select('id'))
        .having((qb) => qb.having('id', '=', 1).orHaving('id', '=', 2))

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select * from "person"`,
            `group by "first_name"`,
            `having "id" in ($1, $2, $3)`,
            `or "first_name" < $4`,
            `and "first_name" = "first_name"`,
            `or "first_name" = "first_name"`,
            `and exists (select "id" from "pet")`,
            `or exists (select "id" from "pet")`,
            `and not exists (select "id" from "pet")`,
            `or not exists (select "id" from "pet")`,
            'and ("id" = $5 or "id" = $6)',
          ],
          bindings: [1, 2, 3, 'foo', 1, 2],
        },
        mysql: {
          sql: [
            'select * from `person`',
            'group by `first_name`',
            'having `id` in (?, ?, ?)',
            'or `first_name` < ?',
            'and `first_name` = `first_name`',
            'or `first_name` = `first_name`',
            'and exists (select `id` from `pet`)',
            'or exists (select `id` from `pet`)',
            'and not exists (select `id` from `pet`)',
            'or not exists (select `id` from `pet`)',
            'and (`id` = ? or `id` = ?)',
          ],
          bindings: [1, 2, 3, 'foo', 1, 2],
        },
      })
    })
  })
}
