import { sql } from '../../..'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  NOT_SUPPORTED,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: coalesce`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
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

    if (dialect === 'postgres' || dialect === 'mysql') {
      it('should coalesce a single item', async () => {
        const query = ctx.db
          .selectFrom('person')
          .select([
            ctx.db.fn.coalesce('first_name').as('ColumnReference'),
            ctx.db.fn
              .coalesce(ctx.db.dynamic.ref('first_name'))
              .as('DynamicReference'),
            ctx.db.fn.coalesce(sql`${1}`).as('RawBuilder'),
          ])

        testSql(query, dialect, {
          postgres: {
            sql: [
              'select',
              'coalesce("first_name") as "ColumnReference",',
              'coalesce("first_name") as "DynamicReference",',
              'coalesce($1) as "RawBuilder"',
              'from "person"',
            ],
            parameters: [1],
          },
          mysql: {
            sql: [
              'select',
              'coalesce(`first_name`) as `ColumnReference`,',
              'coalesce(`first_name`) as `DynamicReference`,',
              'coalesce(?) as `RawBuilder`',
              'from `person`',
            ],
            parameters: [1],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    it('should coalesce two items', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select([
          ctx.db.fn.coalesce('first_name', 'last_name').as('ColumnReference0'),
          ctx.db.fn
            .coalesce('first_name', ctx.db.dynamic.ref('last_name'))
            .as('ColumnReference1'),
          ctx.db.fn.coalesce('first_name', sql`${1}`).as('ColumnReference2'),
          ctx.db.fn
            .coalesce(
              ctx.db.dynamic.ref('first_name'),
              ctx.db.dynamic.ref('last_name')
            )
            .as('DynamicReference0'),
          ctx.db.fn
            .coalesce(ctx.db.dynamic.ref('first_name'), 'last_name')
            .as('DynamicReference1'),
          ctx.db.fn
            .coalesce(ctx.db.dynamic.ref('first_name'), sql`${2}`)
            .as('DynamicReference2'),
          ctx.db.fn.coalesce(sql`${3}`, sql`${4}`).as('RawBuilder0'),
          ctx.db.fn.coalesce(sql`${5}`, 'last_name').as('RawBuilder1'),
          ctx.db.fn
            .coalesce(sql`${6}`, ctx.db.dynamic.ref('last_name'))
            .as('RawBuilder2'),
        ])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select',
            'coalesce("first_name", "last_name") as "ColumnReference0",',
            'coalesce("first_name", "last_name") as "ColumnReference1",',
            'coalesce("first_name", $1) as "ColumnReference2",',
            'coalesce("first_name", "last_name") as "DynamicReference0",',
            'coalesce("first_name", "last_name") as "DynamicReference1",',
            'coalesce("first_name", $2) as "DynamicReference2",',
            'coalesce($3, $4) as "RawBuilder0",',
            'coalesce($5, "last_name") as "RawBuilder1",',
            'coalesce($6, "last_name") as "RawBuilder2"',
            'from "person"',
          ],
          parameters: [1, 2, 3, 4, 5, 6],
        },
        mysql: {
          sql: [
            'select',
            'coalesce(`first_name`, `last_name`) as `ColumnReference0`,',
            'coalesce(`first_name`, `last_name`) as `ColumnReference1`,',
            'coalesce(`first_name`, ?) as `ColumnReference2`,',
            'coalesce(`first_name`, `last_name`) as `DynamicReference0`,',
            'coalesce(`first_name`, `last_name`) as `DynamicReference1`,',
            'coalesce(`first_name`, ?) as `DynamicReference2`,',
            'coalesce(?, ?) as `RawBuilder0`,',
            'coalesce(?, `last_name`) as `RawBuilder1`,',
            'coalesce(?, `last_name`) as `RawBuilder2`',
            'from `person`',
          ],
          parameters: [1, 2, 3, 4, 5, 6],
        },
        sqlite: {
          sql: [
            'select',
            'coalesce("first_name", "last_name") as "ColumnReference0",',
            'coalesce("first_name", "last_name") as "ColumnReference1",',
            'coalesce("first_name", ?) as "ColumnReference2",',
            'coalesce("first_name", "last_name") as "DynamicReference0",',
            'coalesce("first_name", "last_name") as "DynamicReference1",',
            'coalesce("first_name", ?) as "DynamicReference2",',
            'coalesce(?, ?) as "RawBuilder0",',
            'coalesce(?, "last_name") as "RawBuilder1",',
            'coalesce(?, "last_name") as "RawBuilder2"',
            'from "person"',
          ],
          parameters: [1, 2, 3, 4, 5, 6],
        },
      })

      await query.execute()
    })

    it('should coalesce three items', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select([
          ctx.db.fn
            .coalesce(
              'first_name',
              ctx.db.dynamic.ref('last_name'),
              sql.literal('(N/A)')
            )
            .as('name'),
        ])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select',
            `coalesce("first_name", "last_name", '(N/A)') as "name"`,
            'from "person"',
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select',
            "coalesce(`first_name`, `last_name`, '(N/A)') as `name`",
            'from `person`',
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            'select',
            `coalesce("first_name", "last_name", '(N/A)') as "name"`,
            'from "person"',
          ],
          parameters: [],
        },
      })

      await query.execute()
    })
  })
}
