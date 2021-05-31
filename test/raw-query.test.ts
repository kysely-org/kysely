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
  describe(`${dialect}: raw queries`, () => {
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

    it('should run a raw select query', async () => {
      const result = await ctx.db
        .raw<{ first_name: string }>(
          'select first_name from person where gender = ? order by first_name asc, last_name asc',
          ['male']
        )
        .execute()

      expect(result).to.eql({
        numUpdatedOrDeletedRows: undefined,
        insertedPrimaryKey: undefined,
        rows: [{ first_name: 'Arnold' }, { first_name: 'Sylvester' }],
      })
    })

    it('should run a raw update query', async () => {
      const result = await ctx.db
        .raw('update person set first_name = ? where gender = ?', [
          'Updated',
          'male',
        ])
        .execute()

      expect(result).to.eql({
        numUpdatedOrDeletedRows: 2,
        insertedPrimaryKey: undefined,
        rows: [],
      })
    })

    it('should run a raw delete query', async () => {
      const result = await ctx.db
        .raw('delete from person where gender = ?', ['male'])
        .execute()

      expect(result).to.eql({
        numUpdatedOrDeletedRows: 2,
        insertedPrimaryKey: undefined,
        rows: [],
      })
    })

    if (dialect === 'postgres') {
      it('should run a raw insert query', async () => {
        const result = await ctx.db
          .raw(
            'insert into person (first_name, last_name) values (?, ?) returning first_name, last_name',
            ['New', 'Personsson']
          )
          .execute()

        expect(result).to.eql({
          numUpdatedOrDeletedRows: undefined,
          insertedPrimaryKey: undefined,
          rows: [{ first_name: 'New', last_name: 'Personsson' }],
        })
      })
    } else {
      it('should run a raw insert query', async () => {
        const result = await ctx.db
          .raw('insert into person (first_name, last_name) values (?, ?)', [
            'New',
            'Personsson',
          ])
          .execute()

        expect(result.insertedPrimaryKey).to.be.a('number')
      })
    }
  })
}
