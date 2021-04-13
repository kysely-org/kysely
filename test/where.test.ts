import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
} from './test-setup'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: tests for where methods`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)
    })

    beforeEach(async () => {
      await insertPersons(ctx, [
        {
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
          pets: [{ name: 'Catto', species: 'cat' }],
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

    describe('where', () => {
      it('a column name and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1',
            bindings: ['Arnold'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('table.column and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('person.first_name', '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "person"."first_name" = $1',
            bindings: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person).to.containSubset({
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
        })
      })

      it('a raw instance and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(ctx.db.raw('person.first_name'), '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where person.first_name = $1',
            bindings: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person!.first_name).to.equal('Arnold')
      })

      it('a raw instance with bindings and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(ctx.db.raw('??', ['person.first_name']), '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "person"."first_name" = $1',
            bindings: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person!.first_name).to.equal('Arnold')
      })

      it('a subquery and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(
            (qb) =>
              qb
                .subQuery('pet')
                .select('pet.name')
                .whereRef('owner_id', '=', 'person.id'),
            '=',
            'Catto'
          )

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where (select "pet"."name" from "pet" where "owner_id" = "person"."id") = $1',
            bindings: ['Catto'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('a raw instance and a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(ctx.db.raw('?', ['Catto']), '=', (qb) =>
            qb
              .subQuery('pet')
              .select('pet.name')
              .whereRef('owner_id', '=', 'person.id')
          )

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where $1 = (select "pet"."name" from "pet" where "owner_id" = "person"."id")',
            bindings: ['Catto'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person).to.containSubset({
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
        })
      })

      it('a column name and a raw instance with a raw operator', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', ctx.db.raw('='), ctx.db.raw('?', ['Arnold']))

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1',
            bindings: ['Arnold'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('a `where in` query', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', 'in', ['Arnold', 'Jennifer'])

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" in ($1, $2)',
            bindings: ['Arnold', 'Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('two where clauses', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .where('person.last_name', '=', 'Schwarzenegger')

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where "first_name" = $1 and "person"."last_name" = $2',
            bindings: ['Arnold', 'Schwarzenegger'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('single function argument should create a group', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((qb) =>
            qb
              .where('first_name', '=', 'Jennifer')
              .where('last_name', '=', 'Aniston')
          )

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where ("first_name" = $1 and "last_name" = $2)',
            bindings: ['Jennifer', 'Aniston'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })
    })

    describe('orWhere', () => {
      it('two where clauses', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .orWhere('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where "first_name" = $1 or "first_name" = $2',
            bindings: ['Arnold', 'Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('two where clause groups', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .orWhere((qb) =>
            qb
              .where('first_name', '=', 'Jennifer')
              .where('last_name', '=', 'Aniston')
          )

        testSql(query, dialect, {
          postgres: {
            sql:
              'select * from "person" where "first_name" = $1 or ("first_name" = $2 and "last_name" = $3)',
            bindings: ['Arnold', 'Jennifer', 'Aniston'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })
    })
  })
}
