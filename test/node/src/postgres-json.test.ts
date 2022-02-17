import { Generated, Kysely, RawBuilder, sql } from '../../../'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

interface JsonTable {
  id: Generated<number>
  data: {
    number_field: number
    nested: {
      string_field: string
    }
  }
}

describe(`postgres json tests`, () => {
  let ctx: TestContext
  let db: Kysely<{ json_table: JsonTable }>

  before(async function () {
    this.timeout(TEST_INIT_TIMEOUT)
    ctx = await initTest('postgres')

    await ctx.db.schema
      .createTable('json_table')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('data', 'jsonb')
      .execute()

    db = ctx.db
  })

  afterEach(async () => {
    await db.deleteFrom('json_table').execute()
  })

  after(async () => {
    await ctx.db.schema.dropTable('json_table').ifExists().execute()
    await destroyTest(ctx)
  })

  it('should insert a row with a json value', async () => {
    const result = await db
      .insertInto('json_table')
      .values({
        data: json({
          number_field: 1,
          nested: {
            string_field: 'a',
          },
        }),
      })
      .returning('data')
      .executeTakeFirstOrThrow()

    expect(result.data).to.eql({
      number_field: 1,
      nested: {
        string_field: 'a',
      },
    })
  })
})

function json<T>(obj: T): RawBuilder<T> {
  return sql`${JSON.stringify(obj)}`
}
