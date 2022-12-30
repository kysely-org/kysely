import {
  AggregateFunctionBuilder,
  ExpressionBuilder,
  SimpleReferenceExpression,
} from '../../../'
import {
  BUILT_IN_DIALECTS,
  Database,
  destroyTest,
  initTest,
  NOT_SUPPORTED,
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
        let func: ReturnType<typeof getAggregateFunctionFromTestContext>

        before(() => {
          func = getAggregateFunctionFromTestContext(ctx, funcName)
        })

        it(`should execute a query with ${funcName}(column) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('id').as(funcName),
              (eb) =>
                getAggregateFunctionFromExpressionBuilder(
                  eb,
                  funcName
                )('person.id').as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select ${funcName}("id") as "${funcName}",`,
                `${funcName}("person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`id\`) as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("id") as "${funcName}",`,
                `${funcName}("person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(distinct column) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('id').distinct().as(funcName),
              (eb) =>
                getAggregateFunctionFromExpressionBuilder(
                  eb,
                  funcName
                )('person.id')
                  .distinct()
                  .as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select ${funcName}(distinct "id") as "${funcName}",`,
                `${funcName}(distinct "person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(distinct \`id\`) as \`${funcName}\`,`,
                `${funcName}(distinct \`person\`.\`id\`) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}(distinct "id") as "${funcName}",`,
                `${funcName}(distinct "person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(column) over() in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              func('id').over().as(funcName),
              (eb) =>
                getAggregateFunctionFromExpressionBuilder(
                  eb,
                  funcName
                )('person.id')
                  .over()
                  .as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select ${funcName}("id") over() as "${funcName}",`,
                `${funcName}("person"."id") over() as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`id\`) over() as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`) over() as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("id") over() as "${funcName}",`,
                `${funcName}("person"."id") over() as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(column) over(partition by column) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('id')
              .over((ob) => ob.partitionBy(['first_name']))
              .as(funcName),
            (eb) =>
              getAggregateFunctionFromExpressionBuilder(
                eb,
                funcName
              )('person.id')
                .over((ob) => ob.partitionBy('person.first_name'))
                .as(`another_${funcName}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select ${funcName}("id")`,
                `over(partition by "first_name") as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(partition by "person"."first_name") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`id\`)`,
                `over(partition by \`first_name\`) as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`)`,
                `over(partition by \`person\`.\`first_name\`) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("id")`,
                `over(partition by "first_name") as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(partition by "person"."first_name") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(column) over(order by column asc/desc) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('id')
              .over((ob) =>
                ob.orderBy('last_name', 'asc').orderBy('first_name', 'asc')
              )
              .as(funcName),
            (eb) =>
              getAggregateFunctionFromExpressionBuilder(
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
              sql: [
                `select ${funcName}("id")`,
                `over(order by "last_name" asc,`,
                `"first_name" asc) as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(order by "person"."last_name" desc,`,
                `"person"."first_name" desc) as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`id\`)`,
                `over(order by \`last_name\` asc,`,
                `\`first_name\` asc) as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`)`,
                `over(order by \`person\`.\`last_name\` desc,`,
                `\`person\`.\`first_name\` desc) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("id")`,
                `over(order by "last_name" asc,`,
                `"first_name" asc) as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(order by "person"."last_name" desc,`,
                `"person"."first_name" desc) as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(column) over(partition by column order by column asc/desc) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            func('id')
              .over((ob) =>
                ob
                  .partitionBy(['gender'])
                  .orderBy('last_name', 'asc')
                  .orderBy('first_name', 'asc')
              )
              .as(funcName),
            (eb) =>
              getAggregateFunctionFromExpressionBuilder(
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
              sql: [
                `select ${funcName}("id")`,
                `over(partition by "gender"`,
                `order by "last_name" asc,`,
                `"first_name" asc) as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(partition by "person"."gender"`,
                `order by "person"."last_name" desc,`,
                `"person"."first_name" desc) as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`id\`)`,
                `over(partition by \`gender\``,
                `order by \`last_name\` asc,`,
                `\`first_name\` asc) as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`)`,
                `over(partition by \`person\`.\`gender\``,
                `order by \`person\`.\`last_name\` desc,`,
                `\`person\`.\`first_name\` desc) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("id")`,
                `over(partition by "gender"`,
                `order by "last_name" asc,`,
                `"first_name" asc) as "${funcName}",`,
                `${funcName}("person"."id")`,
                `over(partition by "person"."gender"`,
                `order by "person"."last_name" desc,`,
                `"person"."first_name" desc) as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${funcName}(column) in having clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .having(func('person.id'), '>=', 3)

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `having ${funcName}("person"."id") >= $1`,
              ],
              parameters: [3],
            },
            mysql: {
              sql: [
                `select *`,
                `from \`person\``,
                `group by \`person\`.\`gender\``,
                `having ${funcName}(\`person\`.\`id\`) >= ?`,
              ],
              parameters: [3],
            },
            sqlite: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `having ${funcName}("person"."id") >= ?`,
              ],
              parameters: [3],
            },
          })
        })

        it(`should execute a query with ${funcName}(column) in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .orderBy(func('person.id'), 'desc')

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `order by ${funcName}("person"."id") desc`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select *`,
                `from \`person\``,
                `group by \`person\`.\`gender\``,
                `order by ${funcName}(\`person\`.\`id\`) desc`,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `order by ${funcName}("person"."id") desc`,
              ],
              parameters: [],
            },
          })
        })

        it(`should execute a query with ${funcName}(column) and a dynamic reference in select clause`, async () => {
          const dynamicReference = ctx.db.dynamic.ref('person.id')

          const query = ctx.db
            .selectFrom('person')
            .select([
              func(dynamicReference).as(funcName),
              (eb) =>
                getAggregateFunctionFromExpressionBuilder(
                  eb,
                  funcName
                )(dynamicReference).as(`another_${funcName}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select ${funcName}("person"."id") as "${funcName}",`,
                `${funcName}("person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select ${funcName}(\`person\`.\`id\`) as \`${funcName}\`,`,
                `${funcName}(\`person\`.\`id\`) as \`another_${funcName}\``,
                `from \`person\``,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select ${funcName}("person"."id") as "${funcName}",`,
                `${funcName}("person"."id") as "another_${funcName}"`,
                `from "person"`,
              ],
              parameters: [],
            },
          })
        })

        it(`should execute a query with ${funcName}(column) and a dynamic reference in having clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .having(func(ctx.db.dynamic.ref('person.id')), '>=', 3)

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `having ${funcName}("person"."id") >= $1`,
              ],
              parameters: [3],
            },
            mysql: {
              sql: [
                `select *`,
                `from \`person\``,
                `group by \`person\`.\`gender\``,
                `having ${funcName}(\`person\`.\`id\`) >= ?`,
              ],
              parameters: [3],
            },
            sqlite: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `having ${funcName}("person"."id") >= ?`,
              ],
              parameters: [3],
            },
          })
        })

        it(`should execute a query with ${funcName}(column) and a dynamic reference in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .orderBy(func(ctx.db.dynamic.ref('person.id')), 'desc')

          testSql(query, dialect, {
            postgres: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `order by ${funcName}("person"."id") desc`,
              ],
              parameters: [],
            },
            mysql: {
              sql: [
                `select *`,
                `from \`person\``,
                `group by \`person\`.\`gender\``,
                `order by ${funcName}(\`person\`.\`id\`) desc`,
              ],
              parameters: [],
            },
            sqlite: {
              sql: [
                `select *`,
                `from "person"`,
                `group by "person"."gender"`,
                `order by ${funcName}("person"."id") desc`,
              ],
              parameters: [],
            },
          })
        })

        if (dialect === 'postgres' || dialect === 'sqlite') {
          it(`should execute a query with ${funcName}(column) filter(where ...) in select clause`, async () => {
            const query = ctx.db
              .selectFrom('person')
              .select([
                func('person.id')
                  .filterWhere('person.gender', '=', 'female')
                  .as(funcName),
                (eb) =>
                  getAggregateFunctionFromExpressionBuilder(
                    eb,
                    funcName
                  )('person.id')
                    .filterWhere('person.gender', '=', 'female')
                    .as(`another_${funcName}`),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $1) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $2) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
              mysql: NOT_SUPPORTED,
              sqlite: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
            })

            await query.execute()
          })

          it(`should execute a query with ${funcName}(column) filter(where ... and ...) in select clause`, async () => {
            const query = ctx.db
              .selectFrom('person')
              .select([
                func('person.id')
                  .filterWhere('person.gender', '=', 'female')
                  .filterWhere('person.middle_name', 'is not', null)
                  .as(funcName),
                (eb) =>
                  getAggregateFunctionFromExpressionBuilder(
                    eb,
                    funcName
                  )('person.id')
                    .filterWhere('person.gender', '=', 'female')
                    .filterWhere('person.middle_name', 'is not', null)
                    .as(`another_${funcName}`),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $1`,
                  `and "person"."middle_name" is not null) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $2`,
                  `and "person"."middle_name" is not null) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
              mysql: NOT_SUPPORTED,
              sqlite: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?`,
                  `and "person"."middle_name" is not null) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?`,
                  `and "person"."middle_name" is not null) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
            })

            await query.execute()
          })

          it(`should execute a query with ${funcName}(column) filter(where ... or ...) in select clause`, async () => {
            const query = ctx.db
              .selectFrom('person')
              .select([
                func('person.id')
                  .filterWhere('person.gender', '=', 'female')
                  .orFilterWhere('person.middle_name', 'is not', null)
                  .as(funcName),
                (eb) =>
                  getAggregateFunctionFromExpressionBuilder(
                    eb,
                    funcName
                  )('person.id')
                    .filterWhere('person.gender', '=', 'female')
                    .orFilterWhere('person.middle_name', 'is not', null)
                    .as(`another_${funcName}`),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $1`,
                  `or "person"."middle_name" is not null) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $2`,
                  `or "person"."middle_name" is not null) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
              mysql: NOT_SUPPORTED,
              sqlite: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?`,
                  `or "person"."middle_name" is not null) as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?`,
                  `or "person"."middle_name" is not null) as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
            })

            await query.execute()
          })

          it(`should execute a query with ${funcName}(column) filter(where ...) over() in select clause`, async () => {
            const query = ctx.db
              .selectFrom('person')
              .select([
                func('person.id')
                  .filterWhere('person.gender', '=', 'female')
                  .over()
                  .as(funcName),
                (eb) =>
                  getAggregateFunctionFromExpressionBuilder(
                    eb,
                    funcName
                  )('person.id')
                    .filterWhere('person.gender', '=', 'female')
                    .over()
                    .as(`another_${funcName}`),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $1)`,
                  `over() as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = $2)`,
                  `over() as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
              mysql: NOT_SUPPORTED,
              sqlite: {
                sql: [
                  `select ${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?)`,
                  `over() as "${funcName}",`,
                  `${funcName}("person"."id")`,
                  `filter(where "person"."gender" = ?)`,
                  `over() as "another_${funcName}"`,
                  `from "person"`,
                ],
                parameters: ['female', 'female'],
              },
            })

            await query.execute()
          })
        }

        if (funcName === 'count') {
          it(`should execute a query with ${funcName}(*) in select clause`, async () => {
            const query = ctx.db
              .selectFrom('person')
              .select([
                ctx.db.fn[`${funcName}All`]().as(funcName),
                (eb) => eb.fn[`${funcName}All`]().as(`another_${funcName}`),
              ])

            testSql(query, dialect, {
              postgres: {
                sql: [
                  `select ${funcName}(*) as "${funcName}",`,
                  `${funcName}(*) as "another_${funcName}"`,
                  'from "person"',
                ],
                parameters: [],
              },
              mysql: {
                sql: [
                  `select ${funcName}(*) as \`${funcName}\`,`,
                  `${funcName}(*) as \`another_${funcName}\``,
                  'from `person`',
                ],
                parameters: [],
              },
              sqlite: {
                sql: [
                  `select ${funcName}(*) as "${funcName}",`,
                  `${funcName}(*) as "another_${funcName}"`,
                  'from "person"',
                ],
                parameters: [],
              },
            })

            await query.execute()
          })

          if (dialect === 'postgres') {
            it(`should execute a query with ${funcName}(table.*) in select clause`, async () => {
              const query = ctx.db
                .selectFrom('person')
                .innerJoin('pet', 'pet.owner_id', 'person.id')
                .select([
                  ctx.db.fn[`${funcName}All`]('person').as(funcName),
                  (eb) =>
                    eb.fn[`${funcName}All`]('person').as(`another_${funcName}`),
                ])

              testSql(query, dialect, {
                postgres: {
                  sql: [
                    `select ${funcName}("person".*) as "${funcName}",`,
                    `${funcName}("person".*) as "another_${funcName}"`,
                    'from "person"',
                    'inner join "pet" on "pet"."owner_id" = "person"."id"',
                  ],
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await query.execute()
            })
          }
        }
      })
    }
  })
}

function getAggregateFunctionFromTestContext<TB extends keyof Database>(
  ctx: TestContext,
  funcName: typeof funcNames[number]
): AggregateFunction<TB> {
  return ctx.db.fn[funcName] as any
}

function getAggregateFunctionFromExpressionBuilder<TB extends keyof Database>(
  eb: ExpressionBuilder<Database, TB>,
  funcName: typeof funcNames[number]
): AggregateFunction<TB> {
  return eb.fn[funcName] as any
}

type AggregateFunction<
  TB extends keyof Database,
  C extends SimpleReferenceExpression<Database, TB> = SimpleReferenceExpression<
    Database,
    TB
  >
> = (column: C) => AggregateFunctionBuilder<Database, TB>
