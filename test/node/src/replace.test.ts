import { InsertResult, Kysely, sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  Person,
  Database,
  NOT_SUPPORTED,
  insertDefaultDataSet,
  DIALECTS,
} from './test-setup.js'

if (DIALECTS.includes('mysql')) {
  const dialect = 'mysql' as const

  describe(`mysql: replace`, () => {
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

    it('should insert one row', async () => {
      const query = ctx.db.replaceInto('person').values({
        id: 15,
        first_name: 'Foo',
        last_name: 'Barson',
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: NOT_SUPPORTED,
        mysql: {
          sql: 'replace into `person` (`id`, `first_name`, `last_name`, `gender`) values (?, ?, ?, ?)',
          parameters: [15, 'Foo', 'Barson', 'other'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.instanceOf(InsertResult)

      if (dialect === 'mysql') {
        expect(result.insertId).to.be.a('bigint')
      } else {
        expect(result.insertId).to.equal(undefined)
      }

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })

    it('should insert one row with complex values', async () => {
      const query = ctx.db.replaceInto('person').values({
        id: 2500,
        first_name: ctx.db
          .selectFrom('pet')
          .select(sql<string>`max(name)`.as('max_name')),
        last_name: sql`concat('Bar', 'son')`,
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: NOT_SUPPORTED,
        mysql: {
          sql: "replace into `person` (`id`, `first_name`, `last_name`, `gender`) values (?, (select max(name) as `max_name` from `pet`), concat('Bar', 'son'), ?)",
          parameters: [2500, 'other'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.instanceOf(InsertResult)

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Hammo',
        last_name: 'Barson',
      })
    })

    it('should insert the result of a select query', async () => {
      const query = ctx.db
        .replaceInto('person')
        .columns(['first_name', 'gender'])
        .expression((eb) =>
          eb.selectFrom('pet').select(['name', sql`${'other'}`.as('gender')])
        )

      testSql(query, dialect, {
        postgres: NOT_SUPPORTED,
        mysql: {
          sql: 'replace into `person` (`first_name`, `gender`) select `name`, ? as `gender` from `pet`',
          parameters: ['other'],
        },
        sqlite: NOT_SUPPORTED,
      })

      await query.execute()

      const persons = await ctx.db
        .selectFrom('person')
        .select('first_name')
        .orderBy('first_name')
        .execute()

      expect(persons.map((it) => it.first_name)).to.eql([
        'Arnold',
        'Catto',
        'Doggo',
        'Hammo',
        'Jennifer',
        'Sylvester',
      ])
    })

    it('undefined values should be ignored', async () => {
      const query = ctx.db.replaceInto('person').values({
        id: 12,
        gender: 'male',
        middle_name: undefined,
      })

      testSql(query, dialect, {
        postgres: NOT_SUPPORTED,
        mysql: {
          sql: 'replace into `person` (`id`, `gender`) values (?, ?)',
          parameters: [12, 'male'],
        },
        sqlite: NOT_SUPPORTED,
      })

      await query.execute()
    })

    it('should replace on conflict', async () => {
      const [existingPet] = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .limit(1)
        .execute()

      const query = ctx.db
        .replaceInto('pet')
        .values({ ...existingPet, species: 'hamster' })

      testSql(query, dialect, {
        mysql: {
          sql: 'replace into `pet` (`id`, `name`, `owner_id`, `species`) values (?, ?, ?, ?)',
          parameters: [
            existingPet.id,
            existingPet.name,
            existingPet.owner_id,
            'hamster',
          ],
        },
        postgres: NOT_SUPPORTED,
        sqlite: NOT_SUPPORTED,
      })

      await query.execute()

      const updatedPet = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .where('id', '=', existingPet.id)
        .executeTakeFirstOrThrow()

      expect(updatedPet).to.containSubset({
        name: 'Catto',
        species: 'hamster',
      })
    })
  })

  async function getNewestPerson(
    db: Kysely<Database>
  ): Promise<Pick<Person, 'first_name' | 'last_name'> | undefined> {
    return await db
      .selectFrom('person')
      .select(['first_name', 'last_name'])
      .where(
        'id',
        '=',
        db.selectFrom('person').select(sql<number>`max(id)`.as('max_id'))
      )
      .executeTakeFirst()
  }
}
