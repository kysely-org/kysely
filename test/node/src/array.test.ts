import { Generated, Kysely, sql } from '../../..'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
  clearDatabase,
  Person,
  DIALECTS,
} from './test-setup.js'

interface PersonWithArrays extends Person {
  id: Generated<number>
  lucky_numbers: number[]
  nicknames: string[] | null
}

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  if (sqlSpec === 'postgres') {
    describe(`${variant}: arrays`, () => {
      let ctx: TestContext
      let db: Kysely<Omit<Database, 'person'> & { person: PersonWithArrays }>

      before(async function () {
        ctx = await initTest(this, dialect)

        await ctx.db.schema
          .alterTable('person')
          .addColumn('lucky_numbers', sql`integer[]`, (col) =>
            col.notNull().defaultTo(sql`ARRAY[]::integer[]`),
          )
          .addColumn('nicknames', sql`text[]`)
          .execute()

        db = ctx.db as any
      })

      beforeEach(async () => {
        await insertDefaultDataSet(ctx)

        await db
          .updateTable('person')
          .set({
            nicknames: ['Jenny', 'Jen'],
            lucky_numbers: [7, 42],
          })
          .where('first_name', '=', 'Jennifer')
          .execute()
      })

      afterEach(async () => {
        await clearDatabase(ctx)
      })

      after(async () => {
        await destroyTest(ctx)
      })

      it('array columns should get returned as arrays by default', async () => {
        const jennifer = await db
          .selectFrom('person')
          .where('first_name', '=', 'Jennifer')
          .select(['first_name', 'lucky_numbers', 'nicknames'])
          .executeTakeFirstOrThrow()

        expect(jennifer).to.eql({
          first_name: 'Jennifer',
          lucky_numbers: [7, 42],
          nicknames: ['Jenny', 'Jen'],
        })
      })

      it('should filter using the `any` function', async () => {
        const jennifer = await db
          .selectFrom('person')
          .where((eb) => eb(eb.val(7), '=', eb.fn.any('lucky_numbers')))
          .select(['first_name', 'lucky_numbers', 'nicknames'])
          .executeTakeFirstOrThrow()

        expect(jennifer).to.eql({
          first_name: 'Jennifer',
          lucky_numbers: [7, 42],
          nicknames: ['Jenny', 'Jen'],
        })
      })

      it('should filter using the `any` function on a nullable column', async () => {
        const jennifer = await db
          .selectFrom('person')
          .where((eb) => eb(eb.val('Jen'), '=', eb.fn.any('nicknames')))
          .select(['first_name', 'lucky_numbers', 'nicknames'])
          .executeTakeFirstOrThrow()

        expect(jennifer).to.eql({
          first_name: 'Jennifer',
          lucky_numbers: [7, 42],
          nicknames: ['Jenny', 'Jen'],
        })
      })
    })
  }
}
