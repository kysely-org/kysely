import { Updateable } from '../../../dist/cjs'

import {
  destroyTest,
  initTest,
  TestContext,
  Person,
  testSql,
  NOT_SUPPORTED,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

for (const dialect of DIALECTS_WITH_MSSQL) {
  describe.only(`${dialect}: sanitize identifiers`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should escape identifier quotes', async () => {
      const obj: Record<string, unknown> = {
        first_name: 'foo',
        'last_name"`': 'bar',
      }

      const person = obj as unknown as Updateable<Person>
      const query = ctx.db.updateTable('person').set(person)

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "first_name" = $1, "last_name""`" = $2',
          parameters: ['foo', 'bar'],
        },
        mysql: {
          sql: 'update `person` set `first_name` = ?, `last_name"``` = ?',
          parameters: ['foo', 'bar'],
        },
        mssql: {
          sql: 'update "person" set "first_name" = @1, "last_name""`" = @2',
          parameters: ['foo', 'bar'],
        },
        sqlite: {
          sql: 'update "person" set "first_name" = ?, "last_name""`" = ?',
          parameters: ['foo', 'bar'],
        },
      })
    })

    it('should escape multiple identifier quotes', async () => {
      const obj: Record<string, unknown> = {
        first_name: 'foo',
        'last_name""``': 'bar',
      }

      const person = obj as unknown as Updateable<Person>
      const query = ctx.db.updateTable('person').set(person)

      testSql(query, dialect, {
        postgres: {
          sql: 'update "person" set "first_name" = $1, "last_name""""``" = $2',
          parameters: ['foo', 'bar'],
        },
        mysql: {
          sql: 'update `person` set `first_name` = ?, `last_name""````` = ?',
          parameters: ['foo', 'bar'],
        },
        mssql: {
          sql: 'update "person" set "first_name" = @1, "last_name""""``" = @2',
          parameters: ['foo', 'bar'],
        },
        sqlite: {
          sql: 'update "person" set "first_name" = ?, "last_name""""``" = ?',
          parameters: ['foo', 'bar'],
        },
      })
    })
  })
}
