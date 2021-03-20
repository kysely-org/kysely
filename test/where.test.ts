import {
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
} from './test-setup'

describe('tests for where methods', () => {
  let ctx: TestContext

  before(async () => {
    ctx = await initTest()
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
    ])
  })

  afterEach(async () => {
    await clearDatabase(ctx)
  })

  after(async () => {
    await destroyTest(ctx)
  })

  it('test', async () => {
    const persons = await ctx.dbs.postgres
      .selectFrom('person')
      .selectAll('person')
      .execute()
    console.log(persons)
  })
})
