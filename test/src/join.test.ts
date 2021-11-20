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
  describe(`${dialect}: join`, () => {
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
            {
              name: 'Catto',
              species: 'cat',
              toys: [{ name: 'spool', price: 10 }],
            },
          ],
        },
        {
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
          pets: [{ name: 'Doggo', species: 'dog' }],
        },
        {
          first_name: 'Sylvester',
          last_name: 'Stallone',
          gender: 'male',
          pets: [{ name: 'Hammo', species: 'hamster' }],
        },
      ])
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('inner join', () => {
      it(`should inner join a table`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" inner join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            bindings: [],
          },
          mysql: {
            sql: `select * from \`person\` inner join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
            bindings: [],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(3)
        expect(result).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            name: 'Catto',
          },
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            name: 'Doggo',
          },
          {
            first_name: 'Sylvester',
            last_name: 'Stallone',
            name: 'Hammo',
          },
        ])
      })

      it(`should inner join a subquery`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin(
            ctx.db
              .selectFrom('pet')
              .select(['owner_id as oid', 'name'])
              .as('p'),
            'p.oid',
            'person.id'
          )
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select * from "person"`,
              `inner join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            bindings: [],
          },
          mysql: {
            sql: [
              'select * from `person`',
              `inner join (select \`owner_id\` as \`oid\`, \`name\` from \`pet\`) as \`p\``,
              'on `p`.`oid` = `person`.`id`',
              'order by `person`.`first_name`',
            ],
            bindings: [],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(3)
        expect(result).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            name: 'Doggo',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            name: 'Catto',
          },
          {
            first_name: 'Sylvester',
            last_name: 'Stallone',
            name: 'Hammo',
          },
        ])
      })

      it(`should inner join multiple tables`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .innerJoin('toy', 'toy.pet_id', 'pet.id')
          .select(['pet.name as pet_name', 'toy.name as toy_name'])
          .where('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" inner join "pet" on "pet"."owner_id" = "person"."id" inner join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = $1`,
            bindings: ['Jennifer'],
          },
          mysql: {
            sql: `select \`pet\`.\`name\` as \`pet_name\`, \`toy\`.\`name\` as \`toy_name\` from \`person\` inner join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` inner join \`toy\` on \`toy\`.\`pet_id\` = \`pet\`.\`id\` where \`first_name\` = ?`,
            bindings: ['Jennifer'],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(1)
        expect(result).to.containSubset([
          {
            pet_name: 'Catto',
            toy_name: 'spool',
          },
        ])
      })

      it(`should inner join a table using multiple "on" statements`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', (join) =>
            join
              .onRef('pet.owner_id', '=', 'person.id')
              .on('pet.name', 'in', ['Catto', 'Doggo', 'Hammo'])
              .on((join) =>
                join
                  .on('pet.species', '=', 'cat')
                  .orOn('species', '=', 'dog')
                  .orOn(ctx.db.raw('??', ['species']), '=', (qb) =>
                    qb
                      .subQuery('pet')
                      .select(ctx.db.raw(`'hamster'`).as('hamster'))
                      .limit(1)
                      .offset(0)
                  )
              )
          )
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select * from "person"`,
              `inner join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in ($1, $2, $3)`,
              `and ("pet"."species" = $4 or "species" = $5 or "species" = (select 'hamster' as "hamster" from "pet" limit $6 offset $7))`,
              `order by "person"."first_name"`,
            ],
            bindings: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1, 0],
          },
          mysql: {
            sql: [
              'select * from `person`',
              'inner join `pet`',
              'on `pet`.`owner_id` = `person`.`id`',
              'and `pet`.`name` in (?, ?, ?)',
              "and (`pet`.`species` = ? or `species` = ? or `species` = (select 'hamster' as `hamster` from `pet` limit ? offset ?))",
              'order by `person`.`first_name`',
            ],
            bindings: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1, 0],
          },
        })

        await query.execute()
      })

      for (const [existsType, existsSql] of [
        ['onExists', 'exists'],
        ['onNotExists', 'not exists'],
      ] as const) {
        it(`should inner joina table using "${existsType}" statements`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .innerJoin('pet', (join) =>
              join[existsType]((qb) =>
                qb
                  .subQuery('pet as p')
                  .whereRef('p.id', '=', 'pet.id')
                  .whereRef('p.owner_id', '=', 'person.id')
                  .select('id')
              )
            )
            .select('pet.id')

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select "pet"."id" from "person"`,
                `inner join "pet" on ${existsSql}`,
                `(select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
              ],
              bindings: [],
            },
            mysql: {
              sql: [
                'select `pet`.`id` from `person`',
                `inner join \`pet\` on ${existsSql}`,
                '(select `id` from `pet` as `p` where `p`.`id` = `pet`.`id` and `p`.`owner_id` = `person`.`id`)',
              ],
              bindings: [],
            },
          })

          await query.execute()
        })
      }
    })

    describe('left join', () => {
      it(`should left join a table`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" left join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            bindings: [],
          },
          mysql: {
            sql: `select * from \`person\` left join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
            bindings: [],
          },
        })

        await query.execute()
      })

      it(`should left join a subquery`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .leftJoin(
            ctx.db
              .selectFrom('pet')
              .select(['owner_id as oid', 'name'])
              .as('p'),
            'p.oid',
            'person.id'
          )
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select * from "person"`,
              `left join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            bindings: [],
          },
          mysql: {
            sql: [
              'select * from `person`',
              `left join (select \`owner_id\` as \`oid\`, \`name\` from \`pet\`) as \`p\``,
              'on `p`.`oid` = `person`.`id`',
              'order by `person`.`first_name`',
            ],
            bindings: [],
          },
        })

        await query.execute()
      })

      it(`should left join multiple tables`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .select(['pet.name as pet_name', 'toy.name as toy_name'])
          .where('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" left join "pet" on "pet"."owner_id" = "person"."id" left join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = $1`,
            bindings: ['Jennifer'],
          },
          mysql: {
            sql: `select \`pet\`.\`name\` as \`pet_name\`, \`toy\`.\`name\` as \`toy_name\` from \`person\` left join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` left join \`toy\` on \`toy\`.\`pet_id\` = \`pet\`.\`id\` where \`first_name\` = ?`,
            bindings: ['Jennifer'],
          },
        })

        await query.execute()
      })

      it(`should left join a table using multiple "on" statements`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .leftJoin('pet', (join) =>
            join
              .onRef('pet.owner_id', '=', 'person.id')
              .on('pet.name', 'in', ['Catto', 'Doggo', 'Hammo'])
              .on((join) =>
                join
                  .on('pet.species', '=', 'cat')
                  .orOn('species', '=', 'dog')
                  .orOn(ctx.db.raw('??', ['species']), '=', (qb) =>
                    qb
                      .subQuery('pet')
                      .select(ctx.db.raw(`'hamster'`).as('hamster'))
                      .limit(1)
                      .offset(0)
                  )
              )
          )
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select * from "person"`,
              `left join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in ($1, $2, $3)`,
              `and ("pet"."species" = $4 or "species" = $5 or "species" = (select 'hamster' as "hamster" from "pet" limit $6 offset $7))`,
              `order by "person"."first_name"`,
            ],
            bindings: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1, 0],
          },
          mysql: {
            sql: [
              'select * from `person`',
              'left join `pet`',
              'on `pet`.`owner_id` = `person`.`id`',
              'and `pet`.`name` in (?, ?, ?)',
              "and (`pet`.`species` = ? or `species` = ? or `species` = (select 'hamster' as `hamster` from `pet` limit ? offset ?))",
              'order by `person`.`first_name`',
            ],
            bindings: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1, 0],
          },
        })

        await query.execute()
      })

      for (const [existsType, existsSql] of [
        ['onExists', 'exists'],
        ['onNotExists', 'not exists'],
      ] as const) {
        it(`should left joina table using "${existsType}" statements`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .leftJoin('pet', (join) =>
              join[existsType]((qb) =>
                qb
                  .subQuery('pet as p')
                  .whereRef('p.id', '=', 'pet.id')
                  .whereRef('p.owner_id', '=', 'person.id')
                  .select('id')
              )
            )
            .select('pet.id')

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select "pet"."id" from "person"`,
                `left join "pet" on ${existsSql}`,
                `(select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
              ],
              bindings: [],
            },
            mysql: {
              sql: [
                'select `pet`.`id` from `person`',
                `left join \`pet\` on ${existsSql}`,
                '(select `id` from `pet` as `p` where `p`.`id` = `pet`.`id` and `p`.`owner_id` = `person`.`id`)',
              ],
              bindings: [],
            },
          })

          await query.execute()
        })
      }
    })

    describe('right join', () => {
      it(`should right join a table`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .rightJoin('pet', 'pet.owner_id', 'person.id')
          .selectAll()
          .orderBy('person.first_name')

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" right join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            bindings: [],
          },
          mysql: {
            sql: `select * from \`person\` right join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
            bindings: [],
          },
        })

        await query.execute()
      })
    })

    if (dialect !== 'mysql') {
      describe('full join', () => {
        it(`should full join a table`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .fullJoin('pet', 'pet.owner_id', 'person.id')
            .selectAll()
            .orderBy('person.first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" full join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
              bindings: [],
            },
            mysql: {
              sql: `select * from \`person\` full join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
              bindings: [],
            },
          })

          await query.execute()
        })
      })
    }
  })
}
