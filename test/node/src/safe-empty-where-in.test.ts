import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  createTableWithId,
  DIALECTS,
} from './test-setup.js'

import { WithSafeArrayWhereInPlugin, Generated, Kysely } from '../../../'

for (const dialect of DIALECTS) {
  describe(`${dialect}: safe empty array where in`, () => {
    let ctx: TestContext
    let db: Kysely<Database>

    interface Person {
      id: Generated<number>
      firstName: string
    }

    interface Database {
      safeEmptyArrayPerson: Person
    }

    before(async function () {
      ctx = await initTest(this, dialect)

      db = new Kysely<Database>({
        ...ctx.config,
        plugins: [new WithSafeArrayWhereInPlugin()],
      })

      await db.schema.dropTable('safeEmptyArrayPerson').ifExists().execute()
      await createTableWithId(db.schema, dialect, 'safeEmptyArrayPerson')
        .addColumn('firstName', 'varchar(255)')
        .execute()

      await db
        .insertInto('safeEmptyArrayPerson')
        .values([
          {
            firstName: 'John',
          },
          {
            firstName: 'Mary',
          },
          {
            firstName: 'Tom',
          },
        ])
        .execute()
    })

    it('should handle empty array where in without throwing runtime errors', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', [])
        .select('safeEmptyArrayPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1)`,
          ],
          parameters: [null],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` in (?)',
          ],
          parameters: [null],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1)`,
          ],
          parameters: [null],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (?)`,
          ],
          parameters: [null],
        },
      })

      let result = await query.execute()

      expect(result).to.deep.equal([])

      const notInQuery = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'not in', [])
        .select('safeEmptyArrayPerson.firstName')

      testSql(notInQuery, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in ($1)`,
          ],
          parameters: [null],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` not in (?)',
          ],
          parameters: [null],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (@1)`,
          ],
          parameters: [null],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (?)`,
          ],
          parameters: [null],
        },
      })

      result = await notInQuery.execute()

      expect(result).to.deep.equal([])
    })

    it('non-empty array in should not be doing transforms and return expected results', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', ['John', 'Mary'])
        .select('safeEmptyArrayPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      let result = await query.execute()

      expect(result).to.have.length(2)
      expect(result).to.deep.equal([
        { firstName: 'John' },
        { firstName: 'Mary' },
      ])

      const notInQuery = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'not in', ['John', 'Mary'])
        .select('safeEmptyArrayPerson.firstName')

      testSql(notInQuery, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` not in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      result = await notInQuery.execute()

      expect(result).to.have.length(1)
      expect(result).to.deep.equal([{ firstName: 'Tom' }])
    })

    after(async () => {
      await db.schema.dropTable('safeEmptyArrayPerson').ifExists().execute()
      await db.destroy()
      await destroyTest(ctx)
    })
  })
}
