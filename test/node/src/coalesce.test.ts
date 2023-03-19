import { sql } from '../../..'
import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  NOT_SUPPORTED,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS) {
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
        const { coalesce } = ctx.db.fn

        const query = ctx.db
          .selectFrom('person')
          .select([
            coalesce('first_name').as('ColumnReference'),
            coalesce(ctx.db.dynamic.ref('first_name')).as('DynamicReference'),
            coalesce(sql`${1}`).as('RawBuilder'),
            coalesce(ctx.db.fn.max('first_name')).as('AggregateFunction'),
          ])
          .groupBy(['first_name'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              'select',
              'coalesce("first_name") as "ColumnReference",',
              'coalesce("first_name") as "DynamicReference",',
              'coalesce($1) as "RawBuilder",',
              'coalesce(max("first_name")) as "AggregateFunction"',
              'from "person"',
              'group by "first_name"',
            ],
            parameters: [1],
          },
          mysql: {
            sql: [
              'select',
              'coalesce(`first_name`) as `ColumnReference`,',
              'coalesce(`first_name`) as `DynamicReference`,',
              'coalesce(?) as `RawBuilder`,',
              'coalesce(max(`first_name`)) as `AggregateFunction`',
              'from `person`',
              'group by `first_name`',
            ],
            parameters: [1],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    it('should coalesce two items', async () => {
      const { coalesce, max } = ctx.db.fn

      const query = ctx.db
        .selectFrom('person')
        .select([
          coalesce('first_name', 'last_name').as('ColumnReference0'),
          coalesce('first_name', ctx.db.dynamic.ref('last_name')).as(
            'ColumnReference1'
          ),
          coalesce('first_name', sql`${1}`).as('ColumnReference2'),
          coalesce('first_name', max('last_name')).as('ColumnReference3'),
          coalesce(
            ctx.db.dynamic.ref('first_name'),
            ctx.db.dynamic.ref('last_name')
          ).as('DynamicReference0'),
          coalesce(ctx.db.dynamic.ref('first_name'), 'last_name').as(
            'DynamicReference1'
          ),
          coalesce(ctx.db.dynamic.ref('first_name'), sql`${2}`).as(
            'DynamicReference2'
          ),
          coalesce(ctx.db.dynamic.ref('first_name'), max('last_name')).as(
            'DynamicReference3'
          ),
          coalesce(sql`${3}`, sql`${4}`).as('RawBuilder0'),
          coalesce(sql`${5}`, 'last_name').as('RawBuilder1'),
          coalesce(sql`${6}`, ctx.db.dynamic.ref('last_name')).as(
            'RawBuilder2'
          ),
          coalesce(sql`${7}`, max('last_name')).as('RawBuilder3'),
          coalesce(max('first_name'), max('last_name')).as(
            'AggregateFunction0'
          ),
          coalesce(max('first_name'), 'last_name').as('AggregateFunction1'),
          coalesce(max('first_name'), ctx.db.dynamic.ref('last_name')).as(
            'AggregateFunction2'
          ),
          coalesce(max('first_name'), sql`${8}`).as('AggregateFunction3'),
        ])
        .groupBy(['first_name', 'last_name'])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select',
            'coalesce("first_name", "last_name") as "ColumnReference0",',
            'coalesce("first_name", "last_name") as "ColumnReference1",',
            'coalesce("first_name", $1) as "ColumnReference2",',
            'coalesce("first_name", max("last_name")) as "ColumnReference3",',
            'coalesce("first_name", "last_name") as "DynamicReference0",',
            'coalesce("first_name", "last_name") as "DynamicReference1",',
            'coalesce("first_name", $2) as "DynamicReference2",',
            'coalesce("first_name", max("last_name")) as "DynamicReference3",',
            'coalesce($3, $4) as "RawBuilder0",',
            'coalesce($5, "last_name") as "RawBuilder1",',
            'coalesce($6, "last_name") as "RawBuilder2",',
            'coalesce($7, max("last_name")) as "RawBuilder3",',
            'coalesce(max("first_name"), max("last_name")) as "AggregateFunction0",',
            'coalesce(max("first_name"), "last_name") as "AggregateFunction1",',
            'coalesce(max("first_name"), "last_name") as "AggregateFunction2",',
            'coalesce(max("first_name"), $8) as "AggregateFunction3"',
            'from "person"',
            'group by "first_name", "last_name"',
          ],
          parameters: [1, 2, 3, 4, 5, 6, 7, 8],
        },
        mysql: {
          sql: [
            'select',
            'coalesce(`first_name`, `last_name`) as `ColumnReference0`,',
            'coalesce(`first_name`, `last_name`) as `ColumnReference1`,',
            'coalesce(`first_name`, ?) as `ColumnReference2`,',
            'coalesce(`first_name`, max(`last_name`)) as `ColumnReference3`,',
            'coalesce(`first_name`, `last_name`) as `DynamicReference0`,',
            'coalesce(`first_name`, `last_name`) as `DynamicReference1`,',
            'coalesce(`first_name`, ?) as `DynamicReference2`,',
            'coalesce(`first_name`, max(`last_name`)) as `DynamicReference3`,',
            'coalesce(?, ?) as `RawBuilder0`,',
            'coalesce(?, `last_name`) as `RawBuilder1`,',
            'coalesce(?, `last_name`) as `RawBuilder2`,',
            'coalesce(?, max(`last_name`)) as `RawBuilder3`,',
            'coalesce(max(`first_name`), max(`last_name`)) as `AggregateFunction0`,',
            'coalesce(max(`first_name`), `last_name`) as `AggregateFunction1`,',
            'coalesce(max(`first_name`), `last_name`) as `AggregateFunction2`,',
            'coalesce(max(`first_name`), ?) as `AggregateFunction3`',
            'from `person`',
            'group by `first_name`, `last_name`',
          ],
          parameters: [1, 2, 3, 4, 5, 6, 7, 8],
        },
        sqlite: {
          sql: [
            'select',
            'coalesce("first_name", "last_name") as "ColumnReference0",',
            'coalesce("first_name", "last_name") as "ColumnReference1",',
            'coalesce("first_name", ?) as "ColumnReference2",',
            'coalesce("first_name", max("last_name")) as "ColumnReference3",',
            'coalesce("first_name", "last_name") as "DynamicReference0",',
            'coalesce("first_name", "last_name") as "DynamicReference1",',
            'coalesce("first_name", ?) as "DynamicReference2",',
            'coalesce("first_name", max("last_name")) as "DynamicReference3",',
            'coalesce(?, ?) as "RawBuilder0",',
            'coalesce(?, "last_name") as "RawBuilder1",',
            'coalesce(?, "last_name") as "RawBuilder2",',
            'coalesce(?, max("last_name")) as "RawBuilder3",',
            'coalesce(max("first_name"), max("last_name")) as "AggregateFunction0",',
            'coalesce(max("first_name"), "last_name") as "AggregateFunction1",',
            'coalesce(max("first_name"), "last_name") as "AggregateFunction2",',
            'coalesce(max("first_name"), ?) as "AggregateFunction3"',
            'from "person"',
            'group by "first_name", "last_name"',
          ],
          parameters: [1, 2, 3, 4, 5, 6, 7, 8],
        },
      })

      await query.execute()
    })

    it('should coalesce four items', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select([
          ctx.db.fn
            .coalesce(
              'first_name',
              ctx.db.dynamic.ref('last_name'),
              ctx.db.fn.max('last_name'),
              sql.literal('(N/A)')
            )
            .as('name'),
        ])
        .groupBy(['first_name', 'last_name'])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select',
            `coalesce("first_name", "last_name", max("last_name"), '(N/A)') as "name"`,
            'from "person"',
            'group by "first_name", "last_name"',
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select',
            "coalesce(`first_name`, `last_name`, max(`last_name`), '(N/A)') as `name`",
            'from `person`',
            'group by `first_name`, `last_name`',
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            'select',
            `coalesce("first_name", "last_name", max("last_name"), '(N/A)') as "name"`,
            'from "person"',
            'group by "first_name", "last_name"',
          ],
          parameters: [],
        },
      })

      await query.execute()
    })
  })
}
