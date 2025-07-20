import { expect } from 'chai'
import { sql } from '../../../dist/cjs/index.js'
import {
  clearJSONDatabase,
  destroyJSONTest,
  DIALECTS,
  initJSONTest,
  insertDefaultJSONDataSet,
  NOT_SUPPORTED,
  testSql,
  type JSONTestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: select`, () => {
    let ctx: TestContext
    const identifierWrapper = sqlSpec === 'mysql' ? '`' : '"'

    before(async function () {
      ctx = await initJSONTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultJSONDataSet(ctx)
    })

    afterEach(async () => {
      await clearJSONDatabase(ctx)
    })

    after(async () => {
      await destroyJSONTest(ctx)
    })

    it('should not allow SQL injection in table names', async () => {
      const query = sql`select * from ${sql.table(
        `person${identifierWrapper}; drop table person --`,
      )}`.compile(ctx.db)

      expect(query.sql).to.equal(
        `select * from ${identifierWrapper}person${identifierWrapper}${identifierWrapper}; drop table person --${identifierWrapper}`,
      )

      await expect(ctx.db.executeQuery(query)).to.eventually.be.rejected
      await assertDidNotDropTable(ctx, 'person')
    })

    it('should not allow SQL injection in column refs', async () => {
      const query =
        sql`select ${sql.ref(`first_name${identifierWrapper}; drop table person --`)} from person`.compile(
          ctx.db,
        )

      expect(query.sql).to.equal(
        `select ${identifierWrapper}first_name${identifierWrapper}${identifierWrapper}; drop table person --${identifierWrapper} from person`,
      )

      await expect(ctx.db.executeQuery(query)).to.eventually.be.rejected
      await assertDidNotDropTable(ctx, 'person')
    })

    it('should not allow SQL injection in literals', async () => {
      const query = ctx.db
        .selectFrom('person')
        .where('first_name', '=', sql.lit(`Sylvester'; drop table person --`))
        .selectAll()

      expect(query.compile().sql).to.equal(
        `select * from ${identifierWrapper}person${identifierWrapper} where ${identifierWrapper}first_name${identifierWrapper} = 'Sylvester''; drop table person --'`,
      )

      const results = await ctx.db.executeQuery(query)
      expect(results.rows).to.have.length(0)
      await assertDidNotDropTable(ctx, 'person')
    })

    if (dialect === 'mysql' || dialect === 'sqlite') {
      it('should not allow SQL injection in $.key JSON paths', async () => {
        const injection =
          `first' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}; drop table ${identifierWrapper}person${identifierWrapper} -- ` as never

        const query = ctx.db
          .with('people', () =>
            ctx.db
              .selectFrom('person')
              .select(
                sql<{ first: string }>`json_object('first', first_name)`.as(
                  'data',
                ),
              ),
          )
          .selectFrom('people')
          .select((eb) => eb.ref('data', '->$').key(injection).as('first'))

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `with \`people\` as (select json_object('first', first_name) as \`data\` from \`person\`) select \`data\`->'$."first'' as \`first\` from \`people\`; drop table \`person\` -- "' as \`first\` from \`people\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `with "people" as (select json_object('first', first_name) as "data" from "person") select "data"->'$."first'' as \\"first\\" from \\"people\\"; drop table \\"person\\" -- "' as "first" from "people"`,
            parameters: [],
          },
        })
        await ctx.db.executeQuery(query)
        await assertDidNotDropTable(ctx, 'person')
      })

      it('should not allow SQL injection via backslash escape in $.key JSON paths', async () => {
        const injection =
          `first\\' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}; drop table ${identifierWrapper}pet${identifierWrapper} -- ` as never

        const query = ctx.db
          .with('people', () =>
            ctx.db
              .selectFrom('person')
              .select(
                sql<{ first: string }>`json_object('first', first_name)`.as(
                  'data',
                ),
              ),
          )
          .selectFrom('people')
          .select((eb) => eb.ref('data', '->$').key(injection).as('first'))

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `with \`people\` as (select json_object('first', first_name) as \`data\` from \`person\`) select \`data\`->'$."first\\\\\\\\'' as \`first\` from \`people\`; drop table \`pet\` -- "' as \`first\` from \`people\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `with "people" as (select json_object('first', first_name) as "data" from "person") select "data"->'$."first\\\\'' as \\"first\\" from \\"people\\"; drop table \\"pet\\" -- "' as "first" from "people"`,
            parameters: [],
          },
        })
        await ctx.db.executeQuery(query)
        await assertDidNotDropTable(ctx, 'pet')
      })

      it('should not allow SQL injection via backslash escape in string literals', async () => {
        const injection = `\\'; drop table ${identifierWrapper}person${identifierWrapper}; -- `

        const query = ctx.db
          .selectFrom('person')
          .where('first_name', '=', sql.lit(injection))
          .selectAll()

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `select * from \`person\` where \`first_name\` = '\\\\''; drop table \`person\`; -- '`,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select * from "person" where "first_name" = '\\''; drop table "person"; -- '`,
            parameters: [],
          },
        })
        await ctx.db.executeQuery(query)
        await assertDidNotDropTable(ctx, 'person')
      })

      it('should not allow exfiltration via dots in $.key JSON paths', async () => {
        const exfiltration = 'auth.login_count'

        const query = ctx.db.selectFrom('person_metadata').select((eb) =>
          eb
            .ref('profile', '->$')
            .key(exfiltration as never)
            .as('exfiltrated'),
        )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `select \`profile\`->'$."${exfiltration}"' as \`exfiltrated\` from \`person_metadata\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select "profile"->'$."${exfiltration}"' as "exfiltrated" from "person_metadata"`,
            parameters: [],
          },
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via dots and working around quotes in $.key JSON paths', async () => {
        const exfiltration = 'auth"."login_count'

        const query = ctx.db.selectFrom('person_metadata').select((eb) =>
          eb
            .ref('profile', '->$')
            .key(exfiltration as never)
            .as('exfiltrated'),
        )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `select \`profile\`->'$."auth\\\\".\\\\"login_count"' as \`exfiltrated\` from \`person_metadata\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select "profile"->'$."auth\\".\\"login_count"' as "exfiltrated" from "person_metadata"`,
            parameters: [],
          },
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via brackets in $.key JSON paths', async () => {
        const exfiltration = 'tags[0]'

        const query = ctx.db.selectFrom('person_metadata').select((eb) =>
          eb
            .ref('profile', '->$')
            .key(exfiltration as never)
            .as('exfiltrated'),
        )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `select \`profile\`->'$."tags[0]"' as \`exfiltrated\` from \`person_metadata\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select "profile"->'$."tags[0]"' as "exfiltrated" from "person_metadata"`,
            parameters: [],
          },
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via wildcard in $.key JSON paths', async () => {
        const exfiltration = '*'

        const query = ctx.db.selectFrom('person_metadata').select((eb) =>
          eb
            .ref('profile', '->$')
            .key(exfiltration as never)
            .as('exfiltrated'),
        )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: `select \`profile\`->'$."*"' as \`exfiltrated\` from \`person_metadata\``,
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select "profile"->'$."*"' as "exfiltrated" from "person_metadata"`,
            parameters: [],
          },
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via wildcard in $.at JSON paths', async () => {
        const exfiltration = '*'

        expect(() =>
          ctx.db.selectFrom('person_metadata').select((eb) =>
            eb
              .ref('profile', '->$')
              .at(exfiltration as never)
              .as('exfiltrated'),
          ),
        ).to.throw
      })
    }
  })
}

async function assertDidNotDropTable(ctx: JSONTestContext, tableName: string) {
  const tables = await ctx.db.introspection.getTables()

  expect(tables.some((table) => table.name === tableName)).to.be.true
}
