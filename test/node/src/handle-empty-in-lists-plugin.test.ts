import {
  HandleEmptyInListsPlugin,
  pushValueIntoList,
  replaceWithNoncontingentExpression,
} from '../../../dist/cjs/index.js'
import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  DIALECTS,
  insertDefaultDataSet,
  BuiltInDialect,
  NOT_SUPPORTED,
  clearDatabase,
} from './test-setup.js'

const fixtures = [
  {
    strategy: replaceWithNoncontingentExpression,
    replaceIn: (_lhs: string) => '1 = 0',
    inReturnValue: (dialect: BuiltInDialect) =>
      ({
        [dialect]: false,
        mysql: '0',
        sqlite: 0,
      })[dialect],
    replaceNotIn: (_lhs: string) => '1 = 1',
    notInReturnValue: (dialect: BuiltInDialect) =>
      ({
        [dialect]: true,
        mysql: '1',
        sqlite: 1,
      })[dialect],
  },
  {
    strategy: pushValueIntoList('__kysely_no_values_were_provided__'),
    replaceIn: (lhs: string) => `${lhs} in (null)`,
    inReturnValue: () => null,
    replaceNotIn: (lhs: string) =>
      `cast(${lhs} as char) not in ('__kysely_no_values_were_provided__')`,
    notInReturnValue: (dialect: BuiltInDialect) =>
      ({
        [dialect]: true,
        mysql: '1',
        sqlite: 1,
      })[dialect],
  },
] as const

for (const dialect of DIALECTS) {
  describe(`${dialect}: handle empty in lists plugin`, () => {
    for (const fixture of fixtures) {
      describe(`strategy: ${fixture.strategy.name}`, () => {
        let ctx: TestContext

        before(async function () {
          ctx = await initTest(this, dialect, {
            plugins: [
              new HandleEmptyInListsPlugin({ strategy: fixture.strategy }),
            ],
          })
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

        it('should handle `select ... where {{string_ref}} in ()`', async () => {
          const query = ctx.db
            .selectFrom('person')
            .where('first_name', 'in', [])
            .select('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name" from "person" where ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
            mysql: {
              sql: `select \`first_name\` from \`person\` where ${fixture.replaceIn('`first_name`')}`,
              parameters: [],
            },
            mssql: {
              sql: `select "first_name" from "person" where ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `select "first_name" from "person" where ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
          })

          const result = await query.execute()

          expect(result).to.have.lengthOf(0)
        })

        it('should handle `select ... where {{string_ref}} not in ()`', async () => {
          const query = ctx.db
            .selectFrom('person')
            .where('first_name', 'not in', [])
            .select('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name" from "person" where ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
            mysql: {
              sql: `select \`first_name\` from \`person\` where ${fixture.replaceNotIn('`first_name`')}`,
              parameters: [],
            },
            mssql: {
              sql: `select "first_name" from "person" where ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `select "first_name" from "person" where ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
          })

          const result = await query.execute()

          expect(result).to.have.lengthOf(3)
        })

        it('should handle `select ... where {{number_ref}} in ()`', async () => {
          const result = await ctx.db
            .selectFrom('person')
            .where('children', 'in', [])
            .select('children')
            .execute()

          expect(result).to.have.lengthOf(0)
        })

        it('should handle `select ... where {{number_ref}} not in ()`', async () => {
          const result = await ctx.db
            .selectFrom('person')
            .where('children', 'not in', [])
            .select('children')
            .execute()

          expect(result).to.have.lengthOf(3)
        })

        it('should handle `select ... having ... in ()`', async () => {
          const query = ctx.db
            .selectFrom('person')
            .groupBy('first_name')
            .having('first_name', 'in', [])
            .select('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
            mysql: {
              sql: `select \`first_name\` from \`person\` group by \`first_name\` having ${fixture.replaceIn('`first_name`')}`,
              parameters: [],
            },
            mssql: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceIn('"first_name"')}`,
              parameters: [],
            },
          })

          const result = await query.execute()

          expect(result).to.have.lengthOf(0)
        })

        it('should handle `select ... having ... not in ()`', async () => {
          const query = ctx.db
            .selectFrom('person')
            .groupBy('first_name')
            .having('first_name', 'not in', [])
            .select('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
            mysql: {
              sql: `select \`first_name\` from \`person\` group by \`first_name\` having ${fixture.replaceNotIn('`first_name`')}`,
              parameters: [],
            },
            mssql: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `select "first_name" from "person" group by "first_name" having ${fixture.replaceNotIn('"first_name"')}`,
              parameters: [],
            },
          })

          const result = await query.execute()

          expect(result).to.have.lengthOf(3)
        })

        if (
          dialect === 'mysql' ||
          dialect === 'postgres' ||
          dialect === 'sqlite'
        ) {
          it('should handle `select ... in (), ... not in ()`', async () => {
            const query = ctx.db
              .selectFrom('person')
              .select((eb) => [
                eb('first_name', 'in', []).as('in'),
                eb('first_name', 'not in', []).as('not_in'),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: `select ${fixture.replaceIn('"first_name"')} as "in", ${fixture.replaceNotIn('"first_name"')} as "not_in" from "person"`,
                parameters: [],
              },
              mysql: {
                sql: `select ${fixture.replaceIn('`first_name`')} as \`in\`, ${fixture.replaceNotIn('`first_name`')} as \`not_in\` from \`person\``,
                parameters: [],
              },
              mssql: NOT_SUPPORTED,
              sqlite: {
                sql: `select ${fixture.replaceIn('"first_name"')} as "in", ${fixture.replaceNotIn('"first_name"')} as "not_in" from "person"`,
                parameters: [],
              },
            })

            const result = await query.execute()

            expect(result).to.deep.equal(
              new Array(3).fill({
                in: fixture.inReturnValue(dialect),
                not_in: fixture.notInReturnValue(dialect),
              }),
            )
          })
        }

        it('should handle `update ... where ... in ()`', async () => {
          const query = ctx.db
            .updateTable('person')
            .set('first_name', 'Tesla')
            .where('id', 'in', [])

          testSql(query, dialect, {
            postgres: {
              sql: `update "person" set "first_name" = $1 where ${fixture.replaceIn('"id"')}`,
              parameters: ['Tesla'],
            },
            mysql: {
              sql: `update \`person\` set \`first_name\` = ? where ${fixture.replaceIn('`id`')}`,
              parameters: ['Tesla'],
            },
            mssql: {
              sql: `update "person" set "first_name" = @1 where ${fixture.replaceIn('"id"')}`,
              parameters: ['Tesla'],
            },
            sqlite: {
              sql: `update "person" set "first_name" = ? where ${fixture.replaceIn('"id"')}`,
              parameters: ['Tesla'],
            },
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result.numUpdatedRows).to.equal(0n)
        })

        it('should handle `update ... where ... not in ()`', async () => {
          const query = ctx.db
            .updateTable('person')
            .set('first_name', 'John')
            .where('id', 'not in', [])

          testSql(query, dialect, {
            postgres: {
              sql: `update "person" set "first_name" = $1 where ${fixture.replaceNotIn('"id"')}`,
              parameters: ['John'],
            },
            mysql: {
              sql: `update \`person\` set \`first_name\` = ? where ${fixture.replaceNotIn('`id`')}`,
              parameters: ['John'],
            },
            mssql: {
              sql: `update "person" set "first_name" = @1 where ${fixture.replaceNotIn('"id"')}`,
              parameters: ['John'],
            },
            sqlite: {
              sql: `update "person" set "first_name" = ? where ${fixture.replaceNotIn('"id"')}`,
              parameters: ['John'],
            },
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result.numUpdatedRows).to.equal(3n)
        })

        it('should handle `delete ... where ... in ()`', async () => {
          const query = ctx.db.deleteFrom('person').where('id', 'in', [])

          testSql(query, dialect, {
            postgres: {
              sql: `delete from "person" where ${fixture.replaceIn('"id"')}`,
              parameters: [],
            },
            mysql: {
              sql: `delete from \`person\` where ${fixture.replaceIn('`id`')}`,
              parameters: [],
            },
            mssql: {
              sql: `delete from "person" where ${fixture.replaceIn('"id"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `delete from "person" where ${fixture.replaceIn('"id"')}`,
              parameters: [],
            },
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result.numDeletedRows).to.equal(0n)
        })

        it('should handle `delete ... where ... not in ()`', async () => {
          const query = ctx.db.deleteFrom('person').where('id', 'not in', [])

          testSql(query, dialect, {
            postgres: {
              sql: `delete from "person" where ${fixture.replaceNotIn('"id"')}`,
              parameters: [],
            },
            mysql: {
              sql: `delete from \`person\` where ${fixture.replaceNotIn('`id`')}`,
              parameters: [],
            },
            mssql: {
              sql: `delete from "person" where ${fixture.replaceNotIn('"id"')}`,
              parameters: [],
            },
            sqlite: {
              sql: `delete from "person" where ${fixture.replaceNotIn('"id"')}`,
              parameters: [],
            },
          })

          const result = await query.executeTakeFirstOrThrow()

          expect(result.numDeletedRows).to.equal(3n)
        })

        it('should not affect queries with non-empty lists', async () => {
          const query = ctx.db
            .selectFrom('person')
            .where('first_name', 'in', ['Jennifer'])
            .select('first_name')

          testSql(query, dialect, {
            postgres: {
              sql: 'select "first_name" from "person" where "first_name" in ($1)',
              parameters: ['Jennifer'],
            },
            mysql: {
              sql: 'select `first_name` from `person` where `first_name` in (?)',
              parameters: ['Jennifer'],
            },
            mssql: {
              sql: 'select "first_name" from "person" where "first_name" in (@1)',
              parameters: ['Jennifer'],
            },
            sqlite: {
              sql: 'select "first_name" from "person" where "first_name" in (?)',
              parameters: ['Jennifer'],
            },
          })

          const result = await query.execute()

          expect(result).to.deep.equal([{ first_name: 'Jennifer' }])
        })
      })
    }
  })
}
