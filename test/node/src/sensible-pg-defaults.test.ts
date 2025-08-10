import { Pool } from 'pg'
import { Generated, Kysely, PostgresDialect, sql } from '../../../'
import { jsonObjectFrom, SENSIBLE_TYPES } from '../../../helpers/postgres'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
  clearDatabase,
  DIALECTS,
  DIALECT_CONFIGS,
  PLUGINS,
} from './test-setup.js'

interface Values {
  id: Generated<number>
  bigint: string
  timestamptz: string
  timestamp: string
  date: string
  time: string
  timetz: string
  array: number[]
  // @todo: bytea
  // @todo: money
  // @todo: range types
}

if (DIALECTS.includes('postgres')) {
  const dialect = 'postgres'

  describe(`${dialect} sensible defaults`, () => {
    let ctx: TestContext
    let db: Kysely<Database & { values: Values }>

    before(async function () {
      ctx = await initTest(this, dialect, {})

      await ctx.db.schema
        .createTable('values')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('bigint', 'bigint', (col) => col.notNull())
        .addColumn('timestamptz', 'timestamptz', (col) => col.notNull())
        .addColumn('timestamp', 'timestamp', (col) => col.notNull())
        .addColumn('date', 'date', (col) => col.notNull())
        .addColumn('time', 'time', (col) => col.notNull())
        .addColumn('timetz', 'timetz', (col) => col.notNull())
        .addColumn('array', sql`integer[]`, (col) => col.notNull())
        .execute()

      db = new Kysely<Database & { values: Values }>({
        dialect: new PostgresDialect({
          pool: async () => new Pool(DIALECT_CONFIGS.postgres),
          types: SENSIBLE_TYPES,
        }),
        plugins: PLUGINS,
      })
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)

      await db
        .insertInto('values')
        .values({
          bigint: '9223372036854775807',
          timestamptz: '2025-08-10 14:44:40.687342+02',
          timestamp: '2025-08-10 14:44:40.687342Z',
          date: '2025-08-10',
          time: '14:44:40.687342',
          timetz: '14:44:40.687342+02',
          array: [1, 2, 3],
        })
        .execute()
    })

    afterEach(async () => {
      await db.deleteFrom('values').execute()
      await clearDatabase(ctx)
    })

    after(async () => {
      await ctx.db.schema.dropTable('values').ifExists().execute()
      await destroyTest(ctx)
    })

    it('regular selects should return the same values as JSON serialized values', async () => {
      const columns: (keyof Values)[] = [
        'timestamptz',
        'timestamp',
        'date',
        'timetz',
        'time',
        'array',
      ]
      const rawValues = await db
        .selectFrom('values')
        .select(columns)
        .executeTakeFirstOrThrow()
      const { value: jsonValues } = await db
        .selectNoFrom((eb) =>
          jsonObjectFrom(eb.selectFrom('values').select(columns))
            .$notNull()
            .as('value'),
        )
        .executeTakeFirstOrThrow()

      expect(rawValues).to.eql(jsonValues)
    })

    it('to prevent data loss some types should not have the same value as their JSON serialized equivalent', async () => {
      const columns: (keyof Values)[] = ['bigint']
      const rawValues = await db
        .selectFrom('values')
        .select(columns)
        .executeTakeFirstOrThrow()
      const { value: jsonValues } = await db
        .selectNoFrom((eb) =>
          jsonObjectFrom(eb.selectFrom('values').select(columns))
            .$notNull()
            .as('value'),
        )
        .executeTakeFirstOrThrow()

      expect(rawValues.bigint).to.eql('9223372036854775807')
      expect(jsonValues.bigint).to.eql(9223372036854776000)
    })
  })
}
