import { expect } from 'chai'
import { sql } from '../../../dist/cjs/index.js'
import {
  clearJSONDatabase,
  destroyJSONTest,
  DIALECTS,
  initJSONTest,
  insertDefaultJSONDataSet,
  type JSONTestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: select`, () => {
    let ctx: JSONTestContext
    const identifierWrapper = dialect === 'mysql' ? '`' : '"'

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

    if (dialect === 'mysql') {
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

        expect(query.compile().sql).to.equal(
          `with ${identifierWrapper}people${identifierWrapper} as (select json_object('first', first_name) as ${identifierWrapper}data${identifierWrapper} from ${identifierWrapper}person${identifierWrapper}) select ${identifierWrapper}data${identifierWrapper}->'$."first'' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}; drop table ${identifierWrapper}person${identifierWrapper} -- "' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}`,
        )
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

        expect(query.compile().sql).to.equal(
          `with ${identifierWrapper}people${identifierWrapper} as (select json_object('first', first_name) as ${identifierWrapper}data${identifierWrapper} from ${identifierWrapper}person${identifierWrapper}) select ${identifierWrapper}data${identifierWrapper}->'$."first\\\\\\\\'' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}; drop table ${identifierWrapper}pet${identifierWrapper} -- "' as ${identifierWrapper}first${identifierWrapper} from ${identifierWrapper}people${identifierWrapper}`,
        )
        await ctx.db.executeQuery(query)
        await assertDidNotDropTable(ctx, 'pet')
      })

      it('should not allow SQL injection via backslash escape in string literals', async () => {
        const injection = `\\'; drop table ${identifierWrapper}person${identifierWrapper}; -- `

        const query = ctx.db
          .selectFrom('person')
          .where('first_name', '=', sql.lit(injection))
          .selectAll()

        expect(query.compile().sql).to.equal(
          `select * from ${identifierWrapper}person${identifierWrapper} where ${identifierWrapper}first_name${identifierWrapper} = '\\\\''; drop table ${identifierWrapper}person${identifierWrapper}; -- '`,
        )
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

        expect(query.compile().sql).to.equal(
          `select ${identifierWrapper}profile${identifierWrapper}->'$."${exfiltration}"' as ${identifierWrapper}exfiltrated${identifierWrapper} from ${identifierWrapper}person_metadata${identifierWrapper}`,
        )

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

        expect(query.compile().sql).to.equal(
          `select ${identifierWrapper}profile${identifierWrapper}->'$."auth\\\\".\\\\"login_count"' as ${identifierWrapper}exfiltrated${identifierWrapper} from ${identifierWrapper}person_metadata${identifierWrapper}`,
        )

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

        expect(query.compile().sql).to.equal(
          `select ${identifierWrapper}profile${identifierWrapper}->'$."tags[0]"' as ${identifierWrapper}exfiltrated${identifierWrapper} from ${identifierWrapper}person_metadata${identifierWrapper}`,
        )

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via $.* in $.key JSON paths', async () => {
        const exfiltration = '*'

        const query = ctx.db.selectFrom('person_metadata').select((eb) =>
          eb
            .ref('profile', '->$')
            .key(exfiltration as never)
            .as('exfiltrated'),
        )

        expect(query.compile().sql).to.equal(
          `select ${identifierWrapper}profile${identifierWrapper}->'$."*"' as ${identifierWrapper}exfiltrated${identifierWrapper} from ${identifierWrapper}person_metadata${identifierWrapper}`,
        )

        const result = await query.executeTakeFirstOrThrow()

        expect(result.exfiltrated).to.be.null
      })

      it('should not allow exfiltration via $[*] in $.key JSON paths', async () => {
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
