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
  describe(`${dialect}: tests for group by`, () => {
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

    it('group by one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['gender', ctx.db.raw('max(first_name)').as('min_first_name')])
        .groupBy('gender')
        .orderBy('gender')

      testSql(query, dialect, {
        postgres: {
          sql:
            'select "gender", max(first_name) as "min_first_name" from "person" group by "gender" order by "gender" asc',
          bindings: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(2)
      expect(persons).to.containSubset([
        {
          min_first_name: 'Jennifer',
          gender: 'female',
        },
        {
          min_first_name: 'Sylvester',
          gender: 'male',
        },
      ])
    })
  })
}
