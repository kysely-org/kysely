import { sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  DIALECTS,
  limit,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: join`, () => {
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
            parameters: [],
          },
          mysql: {
            sql: `select * from \`person\` inner join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
            parameters: [],
          },
          mssql: {
            sql: `select * from "person" inner join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            parameters: [],
          },
          sqlite: {
            sql: `select * from "person" inner join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            parameters: [],
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
            'person.id',
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
            parameters: [],
          },
          mysql: {
            sql: [
              'select * from `person`',
              `inner join (select \`owner_id\` as \`oid\`, \`name\` from \`pet\`) as \`p\``,
              'on `p`.`oid` = `person`.`id`',
              'order by `person`.`first_name`',
            ],
            parameters: [],
          },
          mssql: {
            sql: [
              `select * from "person"`,
              `inner join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            parameters: [],
          },
          sqlite: {
            sql: [
              `select * from "person"`,
              `inner join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            parameters: [],
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
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: `select \`pet\`.\`name\` as \`pet_name\`, \`toy\`.\`name\` as \`toy_name\` from \`person\` inner join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` inner join \`toy\` on \`toy\`.\`pet_id\` = \`pet\`.\`id\` where \`first_name\` = ?`,
            parameters: ['Jennifer'],
          },
          mssql: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" inner join "pet" on "pet"."owner_id" = "person"."id" inner join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = @1`,
            parameters: ['Jennifer'],
          },
          sqlite: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" inner join "pet" on "pet"."owner_id" = "person"."id" inner join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = ?`,
            parameters: ['Jennifer'],
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

      it('should inner join a table using a complex `on` expression', async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', (join) =>
            join
              .onRef('pet.owner_id', '=', 'person.id')
              .on('pet.name', 'in', ['Catto', 'Doggo', 'Hammo'])
              .on(({ or, eb, ref, selectFrom }) =>
                or([
                  eb('pet.species', '=', 'cat'),
                  eb('species', '=', 'dog'),
                  eb(
                    ref('species'),
                    '=',
                    selectFrom('pet')
                      .select(sql<'hamster'>`'hamster'`.as('hamster'))
                      .$call(limit(1, dialect)),
                  ),
                ]),
              ),
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
              `and ("pet"."species" = $4 or "species" = $5 or "species" = (select 'hamster' as "hamster" from "pet" limit $6))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mysql: {
            sql: [
              'select * from `person`',
              'inner join `pet`',
              'on `pet`.`owner_id` = `person`.`id`',
              'and `pet`.`name` in (?, ?, ?)',
              "and (`pet`.`species` = ? or `species` = ? or `species` = (select 'hamster' as `hamster` from `pet` limit ?))",
              'order by `person`.`first_name`',
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mssql: {
            sql: [
              `select * from "person"`,
              `inner join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (@1, @2, @3)`,
              `and ("pet"."species" = @4 or "species" = @5 or "species" = (select top(1) 'hamster' as "hamster" from "pet"))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog'],
          },
          sqlite: {
            sql: [
              `select * from "person"`,
              `inner join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (?, ?, ?)`,
              `and ("pet"."species" = ? or "species" = ? or "species" = (select 'hamster' as "hamster" from "pet" limit ?))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
        })

        await query.execute()
      })

      it(`should inner join a table using multiple "on" statements`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', (join) =>
            join
              .onRef('pet.owner_id', '=', 'person.id')
              .on('pet.name', 'in', ['Catto', 'Doggo', 'Hammo'])
              .on((eb) =>
                eb.or([
                  eb('pet.species', '=', 'cat'),
                  eb('species', '=', 'dog'),
                  eb(
                    eb.ref('species'),
                    '=',
                    eb
                      .selectFrom('pet')
                      .select(sql<'hamster'>`'hamster'`.as('hamster'))
                      .$call(limit(1, dialect)),
                  ),
                ]),
              ),
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
              `and ("pet"."species" = $4 or "species" = $5 or "species" = (select 'hamster' as "hamster" from "pet" limit $6))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mysql: {
            sql: [
              'select * from `person`',
              'inner join `pet`',
              'on `pet`.`owner_id` = `person`.`id`',
              'and `pet`.`name` in (?, ?, ?)',
              "and (`pet`.`species` = ? or `species` = ? or `species` = (select 'hamster' as `hamster` from `pet` limit ?))",
              'order by `person`.`first_name`',
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mssql: {
            sql: [
              `select * from "person"`,
              `inner join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (@1, @2, @3)`,
              `and ("pet"."species" = @4 or "species" = @5 or "species" = (select top(1) 'hamster' as "hamster" from "pet"))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog'],
          },
          sqlite: {
            sql: [
              `select * from "person"`,
              `inner join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (?, ?, ?)`,
              `and ("pet"."species" = ? or "species" = ? or "species" = (select 'hamster' as "hamster" from "pet" limit ?))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
        })

        await query.execute()
      })

      it(`should inner join a table using "exists" statements`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .innerJoin('pet', (join) =>
            join.on(({ exists, selectFrom }) =>
              exists(
                selectFrom('pet as p')
                  .whereRef('p.id', '=', 'pet.id')
                  .whereRef('p.owner_id', '=', 'person.id')
                  .select('id'),
              ),
            ),
          )
          .select('pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select "pet"."id" from "person"`,
              `inner join "pet" on exists`,
              `(select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            ],
            parameters: [],
          },
          mysql: {
            sql: [
              'select `pet`.`id` from `person`',
              `inner join \`pet\` on exists`,
              '(select `id` from `pet` as `p` where `p`.`id` = `pet`.`id` and `p`.`owner_id` = `person`.`id`)',
            ],
            parameters: [],
          },
          mssql: {
            sql: [
              `select "pet"."id" from "person"`,
              `inner join "pet" on exists`,
              `(select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            ],
            parameters: [],
          },
          sqlite: {
            sql: [
              `select "pet"."id" from "person"`,
              `inner join "pet" on exists`,
              `(select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            ],
            parameters: [],
          },
        })

        await query.execute()
      })
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
            parameters: [],
          },
          mysql: {
            sql: `select * from \`person\` left join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
            parameters: [],
          },
          mssql: {
            sql: `select * from "person" left join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            parameters: [],
          },
          sqlite: {
            sql: `select * from "person" left join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
            parameters: [],
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
            'person.id',
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
            parameters: [],
          },
          mysql: {
            sql: [
              'select * from `person`',
              `left join (select \`owner_id\` as \`oid\`, \`name\` from \`pet\`) as \`p\``,
              'on `p`.`oid` = `person`.`id`',
              'order by `person`.`first_name`',
            ],
            parameters: [],
          },
          mssql: {
            sql: [
              `select * from "person"`,
              `left join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            parameters: [],
          },
          sqlite: {
            sql: [
              `select * from "person"`,
              `left join (select "owner_id" as "oid", "name" from "pet") as "p"`,
              `on "p"."oid" = "person"."id"`,
              `order by "person"."first_name"`,
            ],
            parameters: [],
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
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: `select \`pet\`.\`name\` as \`pet_name\`, \`toy\`.\`name\` as \`toy_name\` from \`person\` left join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` left join \`toy\` on \`toy\`.\`pet_id\` = \`pet\`.\`id\` where \`first_name\` = ?`,
            parameters: ['Jennifer'],
          },
          mssql: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" left join "pet" on "pet"."owner_id" = "person"."id" left join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = @1`,
            parameters: ['Jennifer'],
          },
          sqlite: {
            sql: `select "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" left join "pet" on "pet"."owner_id" = "person"."id" left join "toy" on "toy"."pet_id" = "pet"."id" where "first_name" = ?`,
            parameters: ['Jennifer'],
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
              .on(({ or, eb }) =>
                or([
                  eb('pet.species', '=', 'cat'),
                  eb('species', '=', 'dog'),
                  eb(
                    sql`${sql.ref('species')}`,
                    '=',
                    eb
                      .selectFrom('pet')
                      .select(sql`'hamster'`.as('hamster'))
                      .$call(limit(1, dialect)),
                  ),
                ]),
              ),
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
              `and ("pet"."species" = $4 or "species" = $5 or "species" = (select 'hamster' as "hamster" from "pet" limit $6))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mysql: {
            sql: [
              'select * from `person`',
              'left join `pet`',
              'on `pet`.`owner_id` = `person`.`id`',
              'and `pet`.`name` in (?, ?, ?)',
              "and (`pet`.`species` = ? or `species` = ? or `species` = (select 'hamster' as `hamster` from `pet` limit ?))",
              'order by `person`.`first_name`',
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
          mssql: {
            sql: [
              `select * from "person"`,
              `left join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (@1, @2, @3)`,
              `and ("pet"."species" = @4 or "species" = @5 or "species" = (select top(1) 'hamster' as "hamster" from "pet"))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog'],
          },
          sqlite: {
            sql: [
              `select * from "person"`,
              `left join "pet"`,
              `on "pet"."owner_id" = "person"."id"`,
              `and "pet"."name" in (?, ?, ?)`,
              `and ("pet"."species" = ? or "species" = ? or "species" = (select 'hamster' as "hamster" from "pet" limit ?))`,
              `order by "person"."first_name"`,
            ],
            parameters: ['Catto', 'Doggo', 'Hammo', 'cat', 'dog', 1],
          },
        })

        await query.execute()
      })

      it(`should left join a table using "not exists" statements`, async () => {
        const query = ctx.db
          .selectFrom('person')
          .leftJoin('pet', (join) =>
            join.on(({ not, exists, selectFrom }) =>
              not(
                exists(
                  selectFrom('pet as p')
                    .whereRef('p.id', '=', 'pet.id')
                    .whereRef('p.owner_id', '=', 'person.id')
                    .select('id'),
                ),
              ),
            ),
          )
          .select('pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: `select "pet"."id" from "person" left join "pet" on not exists (select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            parameters: [],
          },
          mysql: {
            sql: 'select `pet`.`id` from `person` left join `pet` on not exists (select `id` from `pet` as `p` where `p`.`id` = `pet`.`id` and `p`.`owner_id` = `person`.`id`)',
            parameters: [],
          },
          mssql: {
            sql: `select "pet"."id" from "person" left join "pet" on not exists (select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            parameters: [],
          },
          sqlite: {
            sql: `select "pet"."id" from "person" left join "pet" on not exists (select "id" from "pet" as "p" where "p"."id" = "pet"."id" and "p"."owner_id" = "person"."id")`,
            parameters: [],
          },
        })

        await query.execute()
      })
    })

    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'mssql') {
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
              parameters: [],
            },
            mysql: {
              sql: `select * from \`person\` right join \`pet\` on \`pet\`.\`owner_id\` = \`person\`.\`id\` order by \`person\`.\`first_name\``,
              parameters: [],
            },
            mssql: {
              sql: `select * from "person" right join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      })
    }

    if (dialect === 'postgres' || dialect === 'mssql') {
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
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: `select * from "person" full join "pet" on "pet"."owner_id" = "person"."id" order by "person"."first_name"`,
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      })
    }

    if (dialect === 'postgres') {
      describe('lateral join', () => {
        it('should join an expression laterally', async () => {
          const query = ctx.db
            .selectFrom('person')
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('pet')
                  .select('name')
                  .whereRef('pet.owner_id', '=', 'person.id')
                  .as('p'),
              (join) => join.onTrue(),
            )
            .select(['first_name', 'p.name'])
            .orderBy('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name", "p"."name" from "person" inner join lateral (select "name" from "pet" where "pet"."owner_id" = "person"."id") as "p" on true order by "first_name"`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          const res = await query.execute()
          expect(res).to.eql([
            { first_name: 'Arnold', name: 'Doggo' },
            { first_name: 'Jennifer', name: 'Catto' },
            { first_name: 'Sylvester', name: 'Hammo' },
          ])
        })

        it('should left join an expression laterally', async () => {
          const query = ctx.db
            .selectFrom('person')
            .leftJoinLateral(
              (eb) =>
                eb
                  .selectFrom('pet')
                  .select('name')
                  .whereRef('pet.owner_id', '=', 'person.id')
                  .as('p'),
              (join) => join.onTrue(),
            )
            .select(['first_name', 'p.name'])
            .orderBy('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name", "p"."name" from "person" left join lateral (select "name" from "pet" where "pet"."owner_id" = "person"."id") as "p" on true order by "first_name"`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          const res = await query.execute()
          expect(res).to.eql([
            { first_name: 'Arnold', name: 'Doggo' },
            { first_name: 'Jennifer', name: 'Catto' },
            { first_name: 'Sylvester', name: 'Hammo' },
          ])
        })
      })
    }

    if (dialect === 'mssql') {
      describe('apply', () => {
        it('should cross apply an expression', async () => {
          const q = ctx.db
            .selectFrom('person')
            .crossApply((eb) =>
              eb
                .selectFrom('pet')
                .whereRef('pet.owner_id', '=', 'person.id')
                .select('pet.name')
                .as('pets'),
            )
            .select(['person.first_name', 'pets.name'])
            .orderBy('pets.name')

          testSql(q, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
            mssql: {
              sql: `select "person"."first_name", "pets"."name" from "person" cross apply (select "pet"."name" from "pet" where "pet"."owner_id" = "person"."id") as "pets" order by "pets"."name"`,
              parameters: [],
            },
          })

          const result = await q.execute()

          expect(result).to.deep.equal([
            { first_name: 'Jennifer', name: 'Catto' },
            { first_name: 'Arnold', name: 'Doggo' },
            { first_name: 'Sylvester', name: 'Hammo' },
          ])
        })

        it('should outer apply an expression', async () => {
          const q = ctx.db
            .selectFrom('person')
            .outerApply((eb) =>
              eb
                .selectFrom('pet')
                .whereRef('pet.owner_id', '=', 'person.id')
                .select('pet.name')
                .as('pets'),
            )
            .select(['person.first_name', 'pets.name'])
            .orderBy('pets.name')

          testSql(q, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
            mssql: {
              sql: `select "person"."first_name", "pets"."name" from "person" outer apply (select "pet"."name" from "pet" where "pet"."owner_id" = "person"."id") as "pets" order by "pets"."name"`,
              parameters: [],
            },
          })

          const result = await q.execute()

          expect(result).to.deep.equal([
            { first_name: 'Jennifer', name: 'Catto' },
            { first_name: 'Arnold', name: 'Doggo' },
            { first_name: 'Sylvester', name: 'Hammo' },
          ])
        })
      })
    }
  })
}
