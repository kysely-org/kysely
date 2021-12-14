import { UpdateResult } from '../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
  NOT_SUPPORTED,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: update`, () => {
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
        .set({
          last_name: (qb) =>
            qb
              .selectFrom('pet')
              .whereRef('person.id', '=', 'owner_id')
              .select('name'),
        })
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

      const person = await ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Jennifer')
        .executeTakeFirstOrThrow()

      expect(person.last_name).to.equal('Catto')
    })

    it('should update update using a raw expression', async () => {
      const query = ctx.db
        .updateTable('person')
        .set({
          last_name: ctx.db.raw('??', ['first_name']),
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

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('should return updated rows when `returning` is used', async () => {
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
          sqlite: NOT_SUPPORTED,  
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
    }
  })
}
