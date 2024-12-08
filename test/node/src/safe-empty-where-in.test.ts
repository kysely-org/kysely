import {
  sql,
  UpdateResult,
  WithSafeArrayWhereInPlugin,
} from '../../../dist/cjs/index.js'
import { Kysely } from '../../../dist/cjs/kysely.js'
import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  DIALECTS,
  insertDefaultDataSet,
  Database,
  NOT_SUPPORTED,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: safe empty array where in`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect, undefined, {
        plugins: [new WithSafeArrayWhereInPlugin()],
      })

      await insertDefaultDataSet(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should handle empty array select from statements without throwing runtime errors', async () => {
      const query = ctx.db
        .selectFrom('person')
        .where('first_name', 'in', [])
        .where('first_name', 'not in', [])
        .select('person.first_name')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in ($1)`,
            `and "first_name" not in ($2)`,
          ],
          parameters: [null, null],
        },
        mysql: {
          sql: [
            'select `person`.`first_name`',
            'from `person`',
            'where `first_name` in (?)',
            'and `first_name` not in (?)',
          ],
          parameters: [null, null],
        },
        mssql: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in (@1)`,
            `and "first_name" not in (@2)`,
          ],
          parameters: [null, null],
        },
        sqlite: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in (?)`,
            `and "first_name" not in (?)`,
          ],
          parameters: [null, null],
        },
      })

      const result = await query.execute()

      expect(result).to.deep.equal([])
    })

    it('regression test: non-empty array select from should return expected results', async () => {
      const query = ctx.db
        .selectFrom('person')
        .where('first_name', 'in', ['Jennifer', 'Arnold'])
        .select('person.first_name')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in ($1, $2)`,
          ],
          parameters: ['Jennifer', 'Arnold'],
        },
        mysql: {
          sql: [
            'select `person`.`first_name`',
            'from `person`',
            'where `first_name` in (?, ?)',
          ],
          parameters: ['Jennifer', 'Arnold'],
        },
        mssql: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in (@1, @2)`,
          ],
          parameters: ['Jennifer', 'Arnold'],
        },
        sqlite: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `where "first_name" in (?, ?)`,
          ],
          parameters: ['Jennifer', 'Arnold'],
        },
      })

      let result = await query.execute()

      expect(result).to.have.length(2)
      expect(result).to.deep.equal([
        { first_name: 'Jennifer' },
        { first_name: 'Arnold' },
      ])
    })

    it('should handle deleteFrom with returning in supported dialects', async () => {
      if (dialect === 'postgres' || dialect === 'sqlite') {
        const query = ctx.db
          .deleteFrom('person')
          .where('first_name', 'in', [])
          .returning(['first_name', 'id'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              `delete from "person"`,
              `where "first_name" in ($1)`,
              `returning "first_name", "id"`,
            ],
            parameters: [null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: [
              `delete from "person"`,
              `where "first_name" in (?)`,
              `returning "first_name", "id"`,
            ],
            parameters: [null],
          },
        })

        const resultWithReturning = await query.execute()

        expect(resultWithReturning).to.deep.equal([])

        const notInWithReturningQuery = ctx.db
          .deleteFrom('person')
          .where('first_name', 'not in', [])
          .returning(['first_name', 'id'])

        testSql(notInWithReturningQuery, dialect, {
          postgres: {
            sql: [
              `delete from "person"`,
              `where "first_name" not in ($1)`,
              `returning "first_name", "id"`,
            ],
            parameters: [null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: [
              `delete from "person"`,
              `where "first_name" not in (?)`,
              `returning "first_name", "id"`,
            ],
            parameters: [null],
          },
        })

        const notInResult = await notInWithReturningQuery.execute()

        expect(notInResult).to.deep.equal([])
      }
    })

    it('having clause', async () => {
      const query = ctx.db
        .selectFrom('person')
        .groupBy('person.first_name')
        .having('first_name', 'in', [])
        .select('person.first_name')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `group by "person"."first_name"`,
            `having "first_name" in ($1)`,
          ],
          parameters: [null],
        },
        mysql: {
          sql: [
            'select `person`.`first_name`',
            'from `person`',
            'group by `person`.`first_name`',
            'having `first_name` in (?)',
          ],
          parameters: [null],
        },
        mssql: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `group by "person"."first_name"`,
            `having "first_name" in (@1)`,
          ],
          parameters: [null],
        },
        sqlite: {
          sql: [
            `select "person"."first_name"`,
            `from "person"`,
            `group by "person"."first_name"`,
            `having "first_name" in (?)`,
          ],
          parameters: [null],
        },
      })

      const res = await query.execute()

      expect(res).to.deep.equal([])
    })

    it('should handle updateTable without returning with no runtime errors', async () => {
      const query = ctx.db
        .updateTable('person')
        .where('first_name', 'in', [])
        .where('first_name', 'not in', [])
        .set('first_name', 'John')

      const result = await query.execute()

      testSql(query, dialect, {
        postgres: {
          sql: [
            `update "person"`,
            `set "first_name" = $1`,
            `where "first_name" in ($2)`,
            `and "first_name" not in ($3)`,
          ],
          parameters: ['John', null, null],
        },
        mysql: {
          sql: [
            'update `person`',
            'set `first_name` = ?',
            'where `first_name` in (?)',
            'and `first_name` not in (?)',
          ],
          parameters: ['John', null, null],
        },
        mssql: {
          sql: [
            `update "person"`,
            'set "first_name" = @1',
            `where "first_name" in (@2)`,
            `and "first_name" not in (@3)`,
          ],
          parameters: ['John', null, null],
        },
        sqlite: {
          sql: [
            `update "person"`,
            `set "first_name" = ?`,
            `where "first_name" in (?)`,
            `and "first_name" not in (?)`,
          ],
          parameters: ['John', null, null],
        },
      })

      if (dialect === 'mysql') {
        expect(result).to.deep.equal([new UpdateResult(BigInt(0), BigInt(0))])
      } else {
        expect(result).to.deep.equal([new UpdateResult(BigInt(0), undefined)])
      }
    })
  })
}
