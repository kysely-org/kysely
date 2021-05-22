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
  describe(`${dialect}: tests for insert methods`, () => {
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

    it('should insert one row', async () => {
      const query = ctx.db
        .insertInto('person')
        .values({ first_name: 'Foo', last_name: 'Barson' })

      testSql(query, dialect, {
        postgres: {
          sql:
            'insert into "person" ("first_name", "last_name") values ($1, $2)',
          bindings: ['Foo', 'Barson'],
        },
      })

      const result = await query.executeTakeFirst()

      // Get the row with the highest id from the db.
      const row = await ctx.db
        .selectFrom('person')
        .select(['first_name', 'last_name'])
        .where(
          'id',
          '=',
          ctx.db.selectFrom('person').select(ctx.db.raw('max(id)').as('max_id'))
        )
        .executeTakeFirst()

      expect(row).to.eql({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })
  })
}
