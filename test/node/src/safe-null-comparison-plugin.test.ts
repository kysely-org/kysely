import { SafeNullComparisonPlugin } from '../../../dist/index.js'

import {
  clearDatabase,
  destroyTest,
  initTest,
  type TestContext,
  testSql,
  insertDefaultDataSet,
  DIALECTS,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect.variant}: safe null comparison`, () => {
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

    it('should replace = with is for null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '=', null)

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" is null',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` where `first_name` is null',
          parameters: [],
        },
        mssql: {
          sql: 'select from "person" where "first_name" is null',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" is null',
          parameters: [],
        },
      })
    })

    it('should not replace = with is for non-null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '=', 'Foo')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" = $1',
          parameters: ['Foo'],
        },
        mysql: {
          sql: 'select from `person` where `first_name` = ?',
          parameters: ['Foo'],
        },
        mssql: {
          sql: 'select from "person" where "first_name" = @1',
          parameters: ['Foo'],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" = ?',
          parameters: ['Foo'],
        },
      })
    })

    it('should replace != with is not for null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '!=', null)

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` where `first_name` is not null',
          parameters: [],
        },
        mssql: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
      })
    })

    it('should not replace != with is not for non-null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '!=', 'Foo')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" != $1',
          parameters: ['Foo'],
        },
        mysql: {
          sql: 'select from `person` where `first_name` != ?',
          parameters: ['Foo'],
        },
        mssql: {
          sql: 'select from "person" where "first_name" != @1',
          parameters: ['Foo'],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" != ?',
          parameters: ['Foo'],
        },
      })
    })

    it('should replace <> with is not for null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '<>', null)

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` where `first_name` is not null',
          parameters: [],
        },
        mssql: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" is not null',
          parameters: [],
        },
      })
    })

    it('should not replace <> with is not for non-null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '<>', 'Foo')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" <> $1',
          parameters: ['Foo'],
        },
        mysql: {
          sql: 'select from `person` where `first_name` <> ?',
          parameters: ['Foo'],
        },
        mssql: {
          sql: 'select from "person" where "first_name" <> @1',
          parameters: ['Foo'],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" <> ?',
          parameters: ['Foo'],
        },
      })
    })

    it('should replace = with is with multiple where clauses', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '=', null)
        .where('last_name', '=', null)

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" is null and "last_name" is null',
          parameters: [],
        },
        mysql: {
          sql: 'select from `person` where `first_name` is null and `last_name` is null',
          parameters: [],
        },
        mssql: {
          sql: 'select from "person" where "first_name" is null and "last_name" is null',
          parameters: [],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" is null and "last_name" is null',
          parameters: [],
        },
      })
    })

    it('should work with mixed null and non-null values', async () => {
      const query = ctx.db
        .withPlugin(new SafeNullComparisonPlugin())
        .selectFrom('person')
        .where('first_name', '=', null)
        .where('last_name', '!=', null)
        .where('last_name', '=', 'Foo')

      testSql(query, dialect, {
        postgres: {
          sql: 'select from "person" where "first_name" is null and "last_name" is not null and "last_name" = $1',
          parameters: ['Foo'],
        },
        mysql: {
          sql: 'select from `person` where `first_name` is null and `last_name` is not null and `last_name` = ?',
          parameters: ['Foo'],
        },
        mssql: {
          sql: 'select from "person" where "first_name" is null and "last_name" is not null and "last_name" = @1',
          parameters: ['Foo'],
        },
        sqlite: {
          sql: 'select from "person" where "first_name" is null and "last_name" is not null and "last_name" = ?',
          parameters: ['Foo'],
        },
      })
    })
  })
}
