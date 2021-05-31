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
  describe(`${dialect}: delete`, () => {
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

    it('should delete one row', async () => {
      const query = ctx.db.deleteFrom('person').where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'delete from "person" where "gender" = $1',
          bindings: ['female'],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.equal(1)

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute()
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    if (dialect === 'postgres') {
      it('should return deleted rows when `returning` is used', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .returning(['first_name', 'last_name'])

        testSql(query, dialect, {
          postgres: {
            sql:
              'delete from "person" where "gender" = $1 returning "first_name", "last_name"',
            bindings: ['male'],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(Object.keys(result[0]).sort()).to.eql([
          'first_name',
          'last_name',
        ])
        expect(result).to.containSubset([
          { first_name: 'Arnold', last_name: 'Schwarzenegger' },
          { first_name: 'Sylvester', last_name: 'Stallone' },
        ])
      })
    }
  })
}
