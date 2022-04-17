import { sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  insertDefaultDataSet,
} from './test-setup.js'

describe.skip(`query builder performance`, () => {
  let ctx: TestContext

  before(async function () {
    ctx = await initTest(this, 'postgres')
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

  it('simple query builder performance test', async () => {
    function test() {
      ctx.db
        .selectFrom(['person as p', 'pet'])
        .innerJoin('toy', 'toy.pet_id', 'pet.id')
        .whereRef('p.id', '=', 'pet.owner_id')
        .where('toy.id', '=', 1)
        .where('p.id', 'in', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .whereExists((eb) =>
          eb
            .selectFrom('toy_schema.toy')
            .whereRef('toy_schema.toy.id', '=', 'toy.id')
        )
        .select([
          'toy.price as price',
          sql`concat(${sql.ref('first_name')}, ' ', ${sql.ref(
            'last_name'
          )})`.as('full_name'),
        ])
        .compile()
    }

    const WARMUP_ROUNDS = 1000
    const TEST_ROUNDS = 100000

    for (let i = 0; i < WARMUP_ROUNDS; ++i) {
      test()
    }

    const t0 = new Date()
    for (let i = 0; i < TEST_ROUNDS; ++i) {
      test()
    }
    const t1 = new Date()

    console.log(
      'query building time:',
      (t1.getTime() - t0.getTime()) / TEST_ROUNDS,
      'ms'
    )
  })
})
