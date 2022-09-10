import {
  AggregateFunctionBuilder,
  ExpressionBuilder,
  StringReference,
} from '../../../'
import {
  BUILT_IN_DIALECTS,
  Database,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup.js'

const funcNames = ['avg', 'count', 'max', 'min', 'sum'] as const

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: aggregate functions`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    for (const funcName of funcNames) {
      describe(funcName, () => {
        let func: ReturnType<typeof getFuncFromTestContext>

        before(() => {
          func = getFuncFromTestContext(ctx, funcName)
        })

        it(`should execute a query with ${funcName}(...) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('person.id').as(funcName),
              (eb) =>
                getFuncFromExpressionBuilder(
                  eb,
                  funcName
                )('person.id').as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}("person"."id") as "${funcName}", ${funcName}("person"."id") as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(\`person\`.\`id\`) as \`${funcName}\`, ${funcName}(\`person\`.\`id\`) as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}("person"."id") as "${funcName}", ${funcName}("person"."id") as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(distinct ...) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('person.id').distinct().as(funcName),
              (eb) =>
                getFuncFromExpressionBuilder(eb, funcName)('person.id')
                  .distinct()
                  .as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}(distinct "person"."id") as "${funcName}", ${funcName}(distinct "person"."id") as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(distinct \`person\`.\`id\`) as \`${funcName}\`, ${funcName}(distinct \`person\`.\`id\`) as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}(distinct "person"."id") as "${funcName}", ${funcName}(distinct "person"."id") as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(...) over() in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('person.id').over().as(funcName),
              (eb) =>
                getFuncFromExpressionBuilder(eb, funcName)('person.id')
                  .over()
                  .as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}("person"."id") over() as "${funcName}", ${funcName}("person"."id") over() as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(\`person\`.\`id\`) over() as \`${funcName}\`, ${funcName}(\`person\`.\`id\`) over() as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}("person"."id") over() as "${funcName}", ${funcName}("person"."id") over() as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(...) over(partition by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('person.id')
              .over((ob) => ob.partitionBy(['person.first_name']))
              .as(funcName),
            (eb) =>
              getFuncFromExpressionBuilder(
                eb,
                funcName
              )('person.id')
                .over((ob) => ob.partitionBy('person.first_name'))
                .as(`another_${funcName}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}("person"."id") over(partition by "person"."first_name") as "${funcName}", ${funcName}("person"."id") over(partition by "person"."first_name") as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(\`person\`.\`id\`) over(partition by \`person\`.\`first_name\`) as \`${funcName}\`, ${funcName}(\`person\`.\`id\`) over(partition by \`person\`.\`first_name\`) as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}("person"."id") over(partition by "person"."first_name") as "${funcName}", ${funcName}("person"."id") over(partition by "person"."first_name") as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(...) over(order by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('person.id')
              .over((ob) =>
                ob
                  .orderBy('person.last_name', 'asc')
                  .orderBy('person.first_name', 'asc')
              )
              .as(funcName),
            (eb) =>
              getFuncFromExpressionBuilder(
                eb,
                funcName
              )('person.id')
                .over((ob) =>
                  ob
                    .orderBy('person.last_name', 'desc')
                    .orderBy('person.first_name', 'desc')
                )
                .as(`another_${funcName}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}("person"."id") over(order by "person"."last_name" asc, "person"."first_name" asc) as "${funcName}", ${funcName}("person"."id") over(order by "person"."last_name" desc, "person"."first_name" desc) as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(\`person\`.\`id\`) over(order by \`person\`.\`last_name\` asc, \`person\`.\`first_name\` asc) as \`${funcName}\`, ${funcName}(\`person\`.\`id\`) over(order by \`person\`.\`last_name\` desc, \`person\`.\`first_name\` desc) as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}("person"."id") over(order by "person"."last_name" asc, "person"."first_name" asc) as "${funcName}", ${funcName}("person"."id") over(order by "person"."last_name" desc, "person"."first_name" desc) as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(...) over(partition by ... order by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('person.id')
              .over((ob) =>
                ob
                  .partitionBy(['person.gender'])
                  .orderBy('person.last_name', 'asc')
                  .orderBy('person.first_name', 'asc')
              )
              .as(funcName),
            (eb) =>
              getFuncFromExpressionBuilder(
                eb,
                funcName
              )('person.id')
                .over((ob) =>
                  ob
                    .partitionBy('person.gender')
                    .orderBy('person.last_name', 'desc')
                    .orderBy('person.first_name', 'desc')
                )
                .as(`another_${funcName}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${funcName}("person"."id") over(partition by "person"."gender" order by "person"."last_name" asc, "person"."first_name" asc) as "${funcName}", ${funcName}("person"."id") over(partition by "person"."gender" order by "person"."last_name" desc, "person"."first_name" desc) as "another_${funcName}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${funcName}(\`person\`.\`id\`) over(partition by \`person\`.\`gender\` order by \`person\`.\`last_name\` asc, \`person\`.\`first_name\` asc) as \`${funcName}\`, ${funcName}(\`person\`.\`id\`) over(partition by \`person\`.\`gender\` order by \`person\`.\`last_name\` desc, \`person\`.\`first_name\` desc) as \`another_${funcName}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${funcName}("person"."id") over(partition by "person"."gender" order by "person"."last_name" asc, "person"."first_name" asc) as "${funcName}", ${funcName}("person"."id") over(partition by "person"."gender" order by "person"."last_name" desc, "person"."first_name" desc) as "another_${funcName}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(...) in having clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .having(func('person.id'), '>=', 3)

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" group by "person"."gender" having ${funcName}("person"."id") >= $1`,
              parameters: [3],
            },
            mysql: {
              sql: `select * from \`person\` group by \`person\`.\`gender\` having ${funcName}(\`person\`.\`id\`) >= ?`,
              parameters: [3],
            },
            sqlite: {
              sql: `select * from "person" group by "person"."gender" having ${funcName}("person"."id") >= ?`,
              parameters: [3],
            },
          })
        })

        it(`should execute a query with ${funcName}(...) in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .orderBy(func('person.id'), 'desc')

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" group by "person"."gender" order by ${funcName}("person"."id") desc`,
              parameters: [],
            },
            mysql: {
              sql: `select * from \`person\` group by \`person\`.\`gender\` order by ${funcName}(\`person\`.\`id\`) desc`,
              parameters: [],
            },
            sqlite: {
              sql: `select * from "person" group by "person"."gender" order by ${funcName}("person"."id") desc`,
              parameters: [],
            },
          })
        })
      })
    }
  })
}

function getFuncFromTestContext<TB extends keyof Database>(
  ctx: TestContext,
  funcName: typeof funcNames[number]
): AggregateFunction<TB> {
  return ctx.db.fn[funcName] as any
}

function getFuncFromExpressionBuilder<TB extends keyof Database>(
  eb: ExpressionBuilder<Database, TB>,
  funcName: typeof funcNames[number]
): AggregateFunction<TB> {
  return eb.fn[funcName] as any
}

type AggregateFunction<
  TB extends keyof Database,
  C extends StringReference<Database, TB> = StringReference<Database, TB>
> = (column: C) => AggregateFunctionBuilder<Database, TB>
