import { Kysely, PostgresDialect, sql } from '../../../'
import { Pool } from 'pg'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  PLUGINS,
  DIALECT_CONFIGS,
  Database,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: select`, () => {
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

    it('should select one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('last_name')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name" from "person" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name` from `person` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "last_name" from "person" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ last_name: 'Aniston' }])
    })

    it('should select one column with an alias', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('last_name as ln')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name" as "ln" from "person" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name` as `ln` from `person` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "last_name" as "ln" from "person" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ ln: 'Aniston' }])
    })

    it('should select one column with a table name', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('person.last_name')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "person"."last_name" from "person" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `person`.`last_name` from `person` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "person"."last_name" from "person" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ last_name: 'Aniston' }])
    })

    it('should select one column with a table name and an alias', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('person.last_name as ln')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "person"."last_name" as "ln" from "person" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `person`.`last_name` as `ln` from `person` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "person"."last_name" as "ln" from "person" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ ln: 'Aniston' }])
    })

    it('should select one field using a subquery', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((qb) =>
          qb
            .selectFrom('pet')
            .whereRef('person.id', '=', 'pet.owner_id')
            .select('name')
            .as('pet_name')
        )
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select (select "name" from "pet" where "person"."id" = "pet"."owner_id") as "pet_name" from "person" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select (select `name` from `pet` where `person`.`id` = `pet`.`owner_id`) as `pet_name` from `person` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select (select "name" from "pet" where "person"."id" = "pet"."owner_id") as "pet_name" from "person" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ pet_name: 'Catto' }])
    })

    // Raw exrpessions are of course supported on all dialects, but we use an
    // expression that's only valid on postgres.
    if (dialect === 'postgres') {
      it('should select one field using a raw expression', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select(
            sql`concat(${sql.ref(
              'first_name'
            )}, ' ', cast(${'Muriel'} as varchar), ' ', ${sql.ref(
              'last_name'
            )})`.as('full_name_with_middle_name')
          )
          .where('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: `select concat("first_name", ' ', cast($1 as varchar), ' ', "last_name") as "full_name_with_middle_name" from "person" where "first_name" = $2`,
            parameters: ['Muriel', 'Jennifer'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(1)
        expect(persons).to.eql([
          { full_name_with_middle_name: 'Jennifer Muriel Aniston' },
        ])
      })
    }

    it('should select multiple fields', async () => {
      const fullName =
        dialect === 'mysql'
          ? sql`concat(first_name, ' ', last_name)`
          : sql`first_name || ' ' || last_name`

      const query = ctx.db
        .selectFrom('person')
        .select([
          'first_name',
          'last_name as ln',
          'person.gender',
          'person.first_name as fn',
          fullName.as('full_name'),
          (qb) =>
            qb
              .selectFrom('pet')
              .whereRef('person.id', '=', 'owner_id')
              .select('name')
              .as('pet_name'),
        ])
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: `select "first_name", "last_name" as "ln", "person"."gender", "person"."first_name" as "fn", first_name || ' ' || last_name as "full_name", (select "name" from "pet" where "person"."id" = "owner_id") as "pet_name" from "person" where "first_name" = $1`,
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: "select `first_name`, `last_name` as `ln`, `person`.`gender`, `person`.`first_name` as `fn`, concat(first_name, ' ', last_name) as `full_name`, (select `name` from `pet` where `person`.`id` = `owner_id`) as `pet_name` from `person` where `first_name` = ?",
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: `select "first_name", "last_name" as "ln", "person"."gender", "person"."first_name" as "fn", first_name || ' ' || last_name as "full_name", (select "name" from "pet" where "person"."id" = "owner_id") as "pet_name" from "person" where "first_name" = ?`,
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([
        {
          first_name: 'Jennifer',
          ln: 'Aniston',
          gender: 'female',
          fn: 'Jennifer',
          full_name: 'Jennifer Aniston',
          pet_name: 'Catto',
        },
      ])
    })

    it('should select columns from multiple tables in a from clause', async () => {
      const query = ctx.db
        .selectFrom(['person', 'pet'])
        .select(['last_name', 'name as pet_name'])
        .whereRef('owner_id', '=', 'person.id')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name", "name" as "pet_name" from "person", "pet" where "owner_id" = "person"."id" and "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name`, `name` as `pet_name` from `person`, `pet` where `owner_id` = `person`.`id` and `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "last_name", "name" as "pet_name" from "person", "pet" where "owner_id" = "person"."id" and "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ last_name: 'Aniston', pet_name: 'Catto' }])
    })

    it('should select columns from multiple expressions in a from clause', async () => {
      const query = ctx.db
        .selectFrom([
          'person',
          ctx.db.selectFrom('pet').select(['owner_id', 'species']).as('p'),
          sql<{ one: number }>`(select 1 as one)`.as('o'),
        ])
        .select(['last_name', 'species as pet_species', 'one'])
        .whereRef('p.owner_id', '=', 'person.id')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name", "species" as "pet_species", "one" from "person", (select "owner_id", "species" from "pet") as "p", (select 1 as one) as "o" where "p"."owner_id" = "person"."id" and "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name`, `species` as `pet_species`, `one` from `person`, (select `owner_id`, `species` from `pet`) as `p`, (select 1 as one) as `o` where `p`.`owner_id` = `person`.`id` and `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "last_name", "species" as "pet_species", "one" from "person", (select "owner_id", "species" from "pet") as "p", (select 1 as one) as "o" where "p"."owner_id" = "person"."id" and "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      await query.execute()
    })

    it('should select columns from joined tables', async () => {
      const query = ctx.db
        .selectFrom('person')
        .innerJoin('pet', 'owner_id', 'person.id')
        .innerJoin('toy', 'pet_id', 'pet.id')
        .where('first_name', '=', 'Jennifer')
        .select(['first_name', 'pet.name as pet_name', 'toy.name as toy_name'])

      testSql(query, dialect, {
        postgres: {
          sql: 'select "first_name", "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" inner join "pet" on "owner_id" = "person"."id" inner join "toy" on "pet_id" = "pet"."id" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'select `first_name`, `pet`.`name` as `pet_name`, `toy`.`name` as `toy_name` from `person` inner join `pet` on `owner_id` = `person`.`id` inner join `toy` on `pet_id` = `pet`.`id` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'select "first_name", "pet"."name" as "pet_name", "toy"."name" as "toy_name" from "person" inner join "pet" on "owner_id" = "person"."id" inner join "toy" on "pet_id" = "pet"."id" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([
        { first_name: 'Jennifer', pet_name: 'Catto', toy_name: 'spool' },
      ])
    })

    it('should select with distinct', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('gender')
        .distinct()
        .orderBy('gender')

      testSql(query, dialect, {
        postgres: {
          sql: 'select distinct "gender" from "person" order by "gender"',
          parameters: [],
        },
        mysql: {
          sql: 'select distinct `gender` from `person` order by `gender`',
          parameters: [],
        },
        sqlite: {
          sql: 'select distinct "gender" from "person" order by "gender"',
          parameters: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.eql([{ gender: 'female' }, { gender: 'male' }])
    })

    if (dialect !== 'sqlite') {
      it('should select a row for update', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select('last_name')
          .where('first_name', '=', 'Jennifer')
          .forUpdate()

        testSql(query, dialect, {
          postgres: {
            sql: 'select "last_name" from "person" where "first_name" = $1 for update',
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: 'select `last_name` from `person` where `first_name` = ? for update',
            parameters: ['Jennifer'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(1)
        expect(persons).to.eql([{ last_name: 'Aniston' }])
      })
    }

    if (dialect === 'postgres') {
      it('should select with distinct on', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select('first_name')
          .distinctOn('gender')
          .orderBy('gender')
          .orderBy('last_name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select distinct on ("gender") "first_name" from "person" order by "gender", "last_name"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(2)
        expect(persons).to.eql([
          { first_name: 'Jennifer' },
          { first_name: 'Arnold' },
        ])
      })

      for (const [methods, sql] of [
        [['forUpdate'], 'for update'],
        [['forShare'], 'for share'],
        [['forNoKeyUpdate'], 'for no key update'],
        [['forKeyShare'], 'for key share'],
        [['forUpdate', 'noWait'], 'for update nowait'],
        [['forUpdate', 'skipLocked'], 'for update skip locked'],
      ] as const) {
        it(`should support "${sql}"`, async () => {
          let query = ctx.db.selectFrom('person').selectAll()

          for (const method of methods) {
            query = query[method]()
          }

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" ${sql}`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      }
    }

    it('should use an aggregate function in a select call', async () => {
      const { max, min } = ctx.db.fn

      const query = ctx.db
        .selectFrom('person')
        .select([
          max('person.first_name').as('max_first_name'),
          min('person.first_name').as('min_first_name'),
        ])

      testSql(query, dialect, {
        postgres: {
          sql: 'select max("person"."first_name") as "max_first_name", min("person"."first_name") as "min_first_name" from "person"',
          parameters: [],
        },
        mysql: {
          sql: 'select max(`person`.`first_name`) as `max_first_name`, min(`person`.`first_name`) as `min_first_name` from `person`',
          parameters: [],
        },
        sqlite: {
          sql: 'select max("person"."first_name") as "max_first_name", min("person"."first_name") as "min_first_name" from "person"',
          parameters: [],
        },
      })

      const { max_first_name, min_first_name } =
        await query.executeTakeFirstOrThrow()

      expect(min_first_name).to.equal('Arnold')
      expect(max_first_name).to.equal('Sylvester')
    })

    if (dialect === 'mysql' || dialect === 'postgres') {
      it('should stream results', async () => {
        const males: unknown[] = []

        const stream = ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .where('gender', '=', 'male')
          .stream()

        for await (const male of stream) {
          males.push(male)
        }

        expect(males).to.have.length(2)
        expect(males).to.eql([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Sylvester',
            last_name: 'Stallone',
            gender: 'male',
          },
        ])
      })

      if (dialect === 'postgres') {
        it('should throw an error if the cursor implementation is not provided for the postgres dialect', async () => {
          const db = new Kysely<Database>({
            dialect: new PostgresDialect({
              pool: async () => new Pool(DIALECT_CONFIGS.postgres),
            }),
            plugins: PLUGINS,
          })

          await expect(
            (async () => {
              for await (const _ of db
                .selectFrom('person')
                .selectAll()
                .stream()) {
              }
            })()
          ).to.be.rejectedWith(
            "'cursorImpl' is not present in your postgres dialect config. It's required to make streaming work in postgres."
          )

          await db.destroy()
        })
      }
    }

    it('modifyFront should add arbitrary SQL to the front of the query', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('gender')
        .modifyFront(sql`distinct`)
        .orderBy('gender')

      testSql(query, dialect, {
        postgres: {
          sql: 'select distinct "gender" from "person" order by "gender"',
          parameters: [],
        },
        mysql: {
          sql: 'select distinct `gender` from `person` order by `gender`',
          parameters: [],
        },
        sqlite: {
          sql: 'select distinct "gender" from "person" order by "gender"',
          parameters: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.eql([{ gender: 'female' }, { gender: 'male' }])
    })

    if (dialect !== 'sqlite') {
      it('modifyEnd should add arbitrary SQL to the end of the query', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select('last_name')
          .where('first_name', '=', 'Jennifer')
          .modifyEnd(sql`for update`)

        testSql(query, dialect, {
          postgres: {
            sql: 'select "last_name" from "person" where "first_name" = $1 for update',
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: 'select `last_name` from `person` where `first_name` = ? for update',
            parameters: ['Jennifer'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(1)
        expect(persons).to.eql([{ last_name: 'Aniston' }])
      })
    }
  })
}
