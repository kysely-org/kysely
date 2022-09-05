import {
  BUILT_IN_DIALECTS,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: aggregate functions`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    for (const func of ['avg', 'count', 'max', 'min', 'sum'] as const) {
      describe(func, () => {
        it(`should execute a query with ${func}(...) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              (ctx.db.fn[func] as Function)('person.id').as(func),
              (qb: any) => qb.fn[func]('person.id').as(`another_${func}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}("person"."id") as "${func}", ${func}("person"."id") as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(\`person\`.\`id\`) as \`${func}\`, ${func}(\`person\`.\`id\`) as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}("person"."id") as "${func}", ${func}("person"."id") as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(distinct ...) in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              (ctx.db.fn[func] as Function)('person.id').distinct().as(func),
              (qb: any) =>
                qb.fn[func]('person.id').distinct().as(`another_${func}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}(distinct "person"."id") as "${func}", ${func}(distinct "person"."id") as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(distinct \`person\`.\`id\`) as \`${func}\`, ${func}(distinct \`person\`.\`id\`) as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}(distinct "person"."id") as "${func}", ${func}(distinct "person"."id") as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(...) over() in select clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .select([
              (ctx.db.fn[func] as Function)('person.id').over().as(func),
              (qb: any) =>
                qb.fn[func]('person.id').over().as(`another_${func}`),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}("person"."id") over() as "${func}", ${func}("person"."id") over() as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(\`person\`.\`id\`) over() as \`${func}\`, ${func}(\`person\`.\`id\`) over() as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}("person"."id") over() as "${func}", ${func}("person"."id") over() as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(...) over(partition by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            (ctx.db.fn[func] as Function)('person.id')
              .over((ob: any) => ob.partitionBy(['person.first_name']))
              .as(func),
            (qb: any) =>
              qb.fn[func]('person.id')
                .over((ob: any) => ob.partitionBy(['person.first_name']))
                .as(`another_${func}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}("person"."id") over(partition by "person"."first_name") as "${func}", ${func}("person"."id") over(partition by "person"."first_name") as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(\`person\`.\`id\`) over(partition by \`person\`.\`first_name\`) as \`${func}\`, ${func}(\`person\`.\`id\`) over(partition by \`person\`.\`first_name\`) as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}("person"."id") over(partition by "person"."first_name") as "${func}", ${func}("person"."id") over(partition by "person"."first_name") as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(...) over(order by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            (ctx.db.fn[func] as Function)('person.id')
              .over((ob: any) =>
                ob
                  .orderBy('person.last_name', 'asc')
                  .orderBy('person.first_name', 'asc')
              )
              .as(func),
            (qb: any) =>
              qb.fn[func]('person.id')
                .over((ob: any) =>
                  ob
                    .orderBy('person.last_name', 'desc')
                    .orderBy('person.first_name', 'desc')
                )
                .as(`another_${func}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}("person"."id") over(order by "person"."last_name" asc, "person"."first_name" asc) as "${func}", ${func}("person"."id") over(order by "person"."last_name" desc, "person"."first_name" desc) as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(\`person\`.\`id\`) over(order by \`person\`.\`last_name\` asc, \`person\`.\`first_name\` asc) as \`${func}\`, ${func}(\`person\`.\`id\`) over(order by \`person\`.\`last_name\` desc, \`person\`.\`first_name\` desc) as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}("person"."id") over(order by "person"."last_name" asc, "person"."first_name" asc) as "${func}", ${func}("person"."id") over(order by "person"."last_name" desc, "person"."first_name" desc) as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(...) over(partition by ... order by ...) in select clause`, async () => {
          const query = ctx.db.selectFrom('person').select([
            (ctx.db.fn[func] as Function)('person.id')
              .over((ob: any) =>
                ob
                  .partitionBy(['person.gender'])
                  .orderBy('person.last_name', 'asc')
                  .orderBy('person.first_name', 'asc')
              )
              .as(func),
            (qb: any) =>
              qb.fn[func]('person.id')
                .over((ob: any) =>
                  ob
                    .partitionBy(['person.gender'])
                    .orderBy('person.last_name', 'desc')
                    .orderBy('person.first_name', 'desc')
                )
                .as(`another_${func}`),
          ])

          testSql(query, dialect, {
            postgres: {
              sql: `select ${func}("person"."id") over(partition by "person"."gender" order by "person"."last_name" asc, "person"."first_name" asc) as "${func}", ${func}("person"."id") over(partition by "person"."gender" order by "person"."last_name" desc, "person"."first_name" desc) as "another_${func}" from "person"`,
              parameters: [],
            },
            mysql: {
              sql: `select ${func}(\`person\`.\`id\`) over(partition by \`person\`.\`gender\` order by \`person\`.\`last_name\` asc, \`person\`.\`first_name\` asc) as \`${func}\`, ${func}(\`person\`.\`id\`) over(partition by \`person\`.\`gender\` order by \`person\`.\`last_name\` desc, \`person\`.\`first_name\` desc) as \`another_${func}\` from \`person\``,
              parameters: [],
            },
            sqlite: {
              sql: `select ${func}("person"."id") over(partition by "person"."gender" order by "person"."last_name" asc, "person"."first_name" asc) as "${func}", ${func}("person"."id") over(partition by "person"."gender" order by "person"."last_name" desc, "person"."first_name" desc) as "another_${func}" from "person"`,
              parameters: [],
            },
          })

          await query.execute()
        })

        it(`should execute a query with ${func}(...) in having clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .having((ctx.db.fn[func] as Function)('person.id'), '>=', 3)

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" group by "person"."gender" having ${func}("person"."id") >= $1`,
              parameters: [3],
            },
            mysql: {
              sql: `select * from \`person\` group by \`person\`.\`gender\` having ${func}(\`person\`.\`id\`) >= ?`,
              parameters: [3],
            },
            sqlite: {
              sql: `select * from "person" group by "person"."gender" having ${func}("person"."id") >= ?`,
              parameters: [3],
            },
          })
        })

        it(`should execute a query with ${func}(...) in order by clause`, async () => {
          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .groupBy(['person.gender'])
            .orderBy((ctx.db.fn[func] as Function)('person.id'), 'desc')

          testSql(query, dialect, {
            postgres: {
              sql: `select * from "person" group by "person"."gender" order by ${func}("person"."id") desc`,
              parameters: [],
            },
            mysql: {
              sql: `select * from \`person\` group by \`person\`.\`gender\` order by ${func}(\`person\`.\`id\`) desc`,
              parameters: [],
            },
            sqlite: {
              sql: `select * from "person" group by "person"."gender" order by ${func}("person"."id") desc`,
              parameters: [],
            },
          })
        })
      })
    }
  })
}
