import { expect } from 'chai'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  initTest,
  insertPersons,
  TestContext,
} from './test-setup'

for (const dialect of DIALECTS) {
  describe(`${dialect}: multi-table select * behavior`, () => {
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

    it("should output toy's id value, when person.*, toy.*", async () => {
      const result = await ctx.db
        .selectFrom('person')
        .leftJoin('toy', 'person.id', 'toy.id')
        .selectAll('person')
        .selectAll('toy')
        .execute()

      expect(result).to.deep.equal([
        {
          id: 1,
          first_name: 'Jennifer',
          middle_name: null,
          last_name: 'Aniston',
          gender: 'female',
          marital_status: null,
          children: 0,
          name: 'spool',
          pet_id: 1,
          price: 10,
        },
        {
          id: null,
          first_name: 'Arnold',
          middle_name: null,
          last_name: 'Schwarzenegger',
          gender: 'male',
          marital_status: null,
          children: 0,
          name: null,
          pet_id: null,
          price: null,
        },
        {
          id: null,
          first_name: 'Sylvester',
          middle_name: null,
          last_name: 'Stallone',
          gender: 'male',
          marital_status: null,
          children: 0,
          name: null,
          pet_id: null,
          price: null,
        },
      ])
    })
  })
}
