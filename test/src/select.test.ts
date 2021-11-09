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
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: select`, () => {
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

    it('should select one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('last_name')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name" from "person" where "first_name" = $1',
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name` from `person` where `first_name` = ?',
          bindings: ['Jennifer'],
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
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name` as `ln` from `person` where `first_name` = ?',
          bindings: ['Jennifer'],
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
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `person`.`last_name` from `person` where `first_name` = ?',
          bindings: ['Jennifer'],
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
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `person`.`last_name` as `ln` from `person` where `first_name` = ?',
          bindings: ['Jennifer'],
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
            .subQuery('pet')
            .whereRef('person.id', '=', 'pet.owner_id')
            .select('name')
            .as('pet_name')
        )
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select (select "name" from "pet" where "person"."id" = "pet"."owner_id") as "pet_name" from "person" where "first_name" = $1',
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select (select `name` from `pet` where `person`.`id` = `pet`.`owner_id`) as `pet_name` from `person` where `first_name` = ?',
          bindings: ['Jennifer'],
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
            ctx.db
              .raw(`concat(??, ' ', cast(? as varchar), ' ', ??)`, [
                'first_name',
                'Muriel',
                'last_name',
              ])
              .as('full_name_with_middle_name')
          )
          .where('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: `select concat("first_name", ' ', cast($1 as varchar), ' ', "last_name") as "full_name_with_middle_name" from "person" where "first_name" = $2`,
            bindings: ['Muriel', 'Jennifer'],
          },
          mysql: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(1)
        expect(persons).to.eql([
          { full_name_with_middle_name: 'Jennifer Muriel Aniston' },
        ])
      })
    }

    it('should select multiple fields', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select([
          'first_name',
          'last_name as ln',
          'person.gender',
          'person.first_name as fn',
          ctx.db.raw(`concat(first_name, ' ', last_name)`).as('full_name'),
          (qb) =>
            qb
              .subQuery('pet')
              .whereRef('person.id', '=', 'owner_id')
              .select('name')
              .as('pet_name'),
        ])
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: `select "first_name", "last_name" as "ln", "person"."gender", "person"."first_name" as "fn", concat(first_name, ' ', last_name) as "full_name", (select "name" from "pet" where "person"."id" = "owner_id") as "pet_name" from "person" where "first_name" = $1`,
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: "select `first_name`, `last_name` as `ln`, `person`.`gender`, `person`.`first_name` as `fn`, concat(first_name, ' ', last_name) as `full_name`, (select `name` from `pet` where `person`.`id` = `owner_id`) as `pet_name` from `person` where `first_name` = ?",
          bindings: ['Jennifer'],
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
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name`, `name` as `pet_name` from `person`, `pet` where `owner_id` = `person`.`id` and `first_name` = ?',
          bindings: ['Jennifer'],
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
          ctx.db.raw<{ one: number }>('(select 1 as one)').as('o'),
        ])
        .select(['last_name', 'species as pet_species', 'one'])
        .whereRef('p.owner_id', '=', 'person.id')
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name", "species" as "pet_species", "one" from "person", (select "owner_id", "species" from "pet") as "p", (select 1 as one) as "o" where "p"."owner_id" = "person"."id" and "first_name" = $1',
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name`, `species` as `pet_species`, `one` from `person`, (select `owner_id`, `species` from `pet`) as `p`, (select 1 as one) as `o` where `p`.`owner_id` = `person`.`id` and `first_name` = ?',
          bindings: ['Jennifer'],
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
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `first_name`, `pet`.`name` as `pet_name`, `toy`.`name` as `toy_name` from `person` inner join `pet` on `owner_id` = `person`.`id` inner join `toy` on `pet_id` = `pet`.`id` where `first_name` = ?',
          bindings: ['Jennifer'],
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
          bindings: [],
        },
        mysql: {
          sql: 'select distinct `gender` from `person` order by `gender`',
          bindings: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.eql([{ gender: 'female' }, { gender: 'male' }])
    })

    it('should select a row for update', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('last_name')
        .where('first_name', '=', 'Jennifer')
        .forUpdate()

      testSql(query, dialect, {
        postgres: {
          sql: 'select "last_name" from "person" where "first_name" = $1 for update',
          bindings: ['Jennifer'],
        },
        mysql: {
          sql: 'select `last_name` from `person` where `first_name` = ? for update',
          bindings: ['Jennifer'],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(1)
      expect(persons).to.eql([{ last_name: 'Aniston' }])
    })

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
            bindings: [],
          },
          mysql: NOT_SUPPORTED,
        })

        const persons = await query.execute()

        expect(persons).to.have.length(2)
        expect(persons).to.eql([
          { first_name: 'Jennifer' },
          { first_name: 'Arnold' },
        ])
      })
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
          bindings: [],
        },
        mysql: {
          sql: 'select max(`person`.`first_name`) as `max_first_name`, min(`person`.`first_name`) as `min_first_name` from `person`',
          bindings: [],
        },
      })

      const { max_first_name, min_first_name } =
        await query.executeTakeFirstOrThrow()

      expect(min_first_name).to.equal('Arnold')
      expect(max_first_name).to.equal('Sylvester')
    })
  })
}
