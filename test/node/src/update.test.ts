import { UpdateResult, sql } from '../../../'

import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  insertDefaultDataSet,
  DEFAULT_DATA_SET,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: update`, () => {
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

    it('should update one row', async () => {
      const query = ctx.db
        .updateTable('person')
        .set({ first_name: 'Foo', last_name: 'Barson' })
        .where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "first_name" = $1, "last_name" = $2 where "gender" = $3',
          parameters: ['Foo', 'Barson', 'female'],
        },
        mysql: {
          sql: 'update `person` set `first_name` = ?, `last_name` = ? where `gender` = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
        sqlite: {
          sql: 'update "person" set "first_name" = ?, "last_name" = ? where "gender" = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute()
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Foo', last_name: 'Barson', gender: 'female' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    it('should update one row using the (key, value) variant of `set` method', async () => {
      const query = ctx.db
        .updateTable('person')
        .set('first_name', 'Foo')
        .set((eb) => eb.ref('last_name'), 'Barson')
        .set('gender', (eb) => eb.val('other' as const))
        .where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "first_name" = $1, "last_name" = $2, "gender" = $3 where "gender" = $4',
          parameters: ['Foo', 'Barson', 'other', 'female'],
        },
        mysql: {
          sql: 'update `person` set `first_name` = ?, `last_name` = ?, `gender` = ? where `gender` = ?',
          parameters: ['Foo', 'Barson', 'other', 'female'],
        },
        sqlite: {
          sql: 'update "person" set "first_name" = ?, "last_name" = ?, "gender" = ? where "gender" = ?',
          parameters: ['Foo', 'Barson', 'other', 'female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute()
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Foo', last_name: 'Barson', gender: 'other' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    it('should update one row with table alias', async () => {
      const query = ctx.db
        .updateTable('person as p')
        .set({ first_name: 'Foo', last_name: 'Barson' })
        .where('p.gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" as "p" set "first_name" = $1, "last_name" = $2 where "p"."gender" = $3',
          parameters: ['Foo', 'Barson', 'female'],
        },
        mysql: {
          sql: 'update `person` as `p` set `first_name` = ?, `last_name` = ? where `p`.`gender` = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
        sqlite: {
          sql: 'update "person" as "p" set "first_name" = ?, "last_name" = ? where "p"."gender" = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute()
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Foo', last_name: 'Barson', gender: 'female' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    it('should update one row using a subquery', async () => {
      const query = ctx.db
        .updateTable('person')
        .set((eb) => ({
          last_name: eb
            .selectFrom('pet')
            .select('name')
            .whereRef('person.id', '=', 'owner_id'),
        }))
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "last_name" = (select "name" from "pet" where "person"."id" = "owner_id") where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'update `person` set `last_name` = (select `name` from `pet` where `person`.`id` = `owner_id`) where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'update "person" set "last_name" = (select "name" from "pet" where "person"."id" = "owner_id") where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      const person = await ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Jennifer')
        .executeTakeFirstOrThrow()

      expect(person.last_name).to.equal('Catto')
    })

    if (dialect === 'postgres') {
      it('should update one row using an expression', async () => {
        const query = ctx.db
          .updateTable('person')
          .set((eb) => ({
            first_name: eb('first_name', '||', '2'),
          }))
          .where('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: 'update "person" set "first_name" = "first_name" || $1 where "first_name" = $2',
            parameters: ['2', 'Jennifer'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(UpdateResult)
        expect(result.numUpdatedRows).to.equal(1n)
        expect(result.numChangedRows).to.undefined

        const jennifer = await ctx.db
          .selectFrom('person')
          .where('first_name', '=', 'Jennifer2')
          .select('first_name')
          .executeTakeFirstOrThrow()

        expect(jennifer.first_name).to.equal('Jennifer2')
      })
    }

    it('should update one row using a raw expression', async () => {
      const query = ctx.db
        .updateTable('person')
        .set({
          last_name: sql`${sql.ref('first_name')}`,
        })
        .where('first_name', '=', 'Jennifer')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "last_name" = "first_name" where "first_name" = $1',
          parameters: ['Jennifer'],
        },
        mysql: {
          sql: 'update `person` set `last_name` = `first_name` where `first_name` = ?',
          parameters: ['Jennifer'],
        },
        sqlite: {
          sql: 'update "person" set "last_name" = "first_name" where "first_name" = ?',
          parameters: ['Jennifer'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      const jennifer = await ctx.db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select('last_name')
        .executeTakeFirstOrThrow()

      expect(jennifer.last_name).to.equal('Jennifer')
    })

    it('should update one row while ignoring undefined values', async () => {
      const query = ctx.db
        .updateTable('person')
        .set({ id: undefined, first_name: 'Foo', last_name: 'Barson' })
        .where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "first_name" = $1, "last_name" = $2 where "gender" = $3',
          parameters: ['Foo', 'Barson', 'female'],
        },
        mysql: {
          sql: 'update `person` set `first_name` = ?, `last_name` = ? where `gender` = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
        sqlite: {
          sql: 'update "person" set "first_name" = ?, "last_name" = ? where "gender" = ?',
          parameters: ['Foo', 'Barson', 'female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(UpdateResult)
      expect(result.numUpdatedRows).to.equal(1n)
      if (dialect === 'mysql') {
        expect(result.numChangedRows).to.equal(1n)
      } else {
        expect(result.numChangedRows).to.undefined
      }

      const female = await ctx.db
        .selectFrom('person')
        .where('gender', '=', 'female')
        .select(['first_name', 'last_name'])
        .executeTakeFirstOrThrow()

      expect(female).to.deep.equal({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should update some rows and return updated rows when `returning` is used', async () => {
        const query = ctx.db
          .updateTable('person')
          .set({ last_name: 'Barson' })
          .where('gender', '=', 'male')
          .returning(['first_name', 'last_name'])

        testSql(query, dialect, {
          postgres: {
            sql: 'update "person" set "last_name" = $1 where "gender" = $2 returning "first_name", "last_name"',
            parameters: ['Barson', 'male'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            sql: 'update "person" set "last_name" = ? where "gender" = ? returning "first_name", "last_name"',
            parameters: ['Barson', 'male'],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(Object.keys(result[0]).sort()).to.eql([
          'first_name',
          'last_name',
        ])
        expect(result).to.containSubset([
          { first_name: 'Arnold', last_name: 'Barson' },
          { first_name: 'Sylvester', last_name: 'Barson' },
        ])
      })

      it('should update all rows, returning some fields of updated rows, and conditionally returning additional fields', async () => {
        const condition = true

        const query = ctx.db
          .updateTable('person')
          .set({ last_name: 'Barson' })
          .returning('first_name')
          .$if(condition, (qb) => qb.returning('last_name'))

        const result = await query.executeTakeFirstOrThrow()

        expect(result.last_name).to.equal('Barson')
      })

      it('should update some rows and join a table when `from` is called', async () => {
        const query = ctx.db
          .updateTable('person')
          .from('pet')
          .set({
            first_name: (eb) => eb.ref('pet.name'),
          })
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Arnold')
          .returning('first_name')

        testSql(query, dialect, {
          postgres: {
            sql: 'update "person" set "first_name" = "pet"."name" from "pet" where "pet"."owner_id" = "person"."id" and "person"."first_name" = $1 returning "first_name"',
            parameters: ['Arnold'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            sql: 'update "person" set "first_name" = "pet"."name" from "pet" where "pet"."owner_id" = "person"."id" and "person"."first_name" = ? returning "first_name"',
            parameters: ['Arnold'],
          },
        })

        const result = await query.execute()

        expect(result[0].first_name).to.equal('Doggo')
      })
    }

    if (dialect === 'postgres') {
      it('should update multiple rows and stream returned results', async () => {
        const stream = ctx.db
          .updateTable('person')
          .set({ last_name: 'Nobody' })
          .returning(['first_name', 'last_name', 'gender'])
          .stream()

        const people = []

        for await (const person of stream) {
          people.push(person)
        }

        expect(people).to.have.length(DEFAULT_DATA_SET.length)
        expect(people).to.eql(
          DEFAULT_DATA_SET.map(({ first_name, gender }) => ({
            first_name,
            last_name: 'Nobody',
            gender,
          }))
        )
      })
    }

    if (dialect === 'mysql') {
      it('should update but not change the row', async () => {
        const query = ctx.db
          .updateTable('person')
          .set({
            first_name: 'Jennifer',
          })
          .where('first_name', '=', 'Jennifer')

        await query.execute()
        const result = await query.executeTakeFirst()
        expect(result).instanceOf(UpdateResult)
        expect(result.numUpdatedRows).to.equal(1n)
        expect(result.numChangedRows).to.equal(0n)
      })
    }

    it('should create an update query that uses a CTE', async () => {
      const query = ctx.db
        .with('jennifer_id', (qb) =>
          qb
            .selectFrom('person')
            .where('first_name', '=', 'Jennifer')
            .limit(1)
            .select('id')
        )
        .updateTable('pet')
        .set((eb) => ({
          owner_id: eb.selectFrom('jennifer_id').select('id'),
        }))

      await query.execute()

      const jennifer = await ctx.db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select('id')
        .executeTakeFirstOrThrow()

      const pets = await ctx.db.selectFrom('pet').select('owner_id').execute()
      expect(pets).to.have.length(3)

      // All pets should now belong to jennifer.
      for (const pet of pets) {
        expect(pet.owner_id).to.equal(jennifer.id)
      }
    })

    if (dialect === 'postgres') {
      it('should update using a from clause and a join', async () => {
        const query = ctx.db
          .updateTable('pet as p')
          .from('pet')
          .whereRef('p.id', '=', 'pet.id')
          .innerJoin('person', 'person.id', 'pet.owner_id')
          .set((eb) => ({
            name: eb.fn.coalesce('person.first_name', eb.val('')),
          }))

        await query.execute()

        const pets = await ctx.db
          .selectFrom('pet')
          .innerJoin('person', 'person.id', 'pet.owner_id')
          .select(['pet.name as pet_name', 'person.first_name as person_name'])
          .execute()

        expect(pets).to.have.length(3)
        for (const pet of pets) {
          expect(pet.person_name).to.equal(pet.pet_name)
        }
      })
    }
  })
}
