import { Kysely } from '../../'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  testSql,
  expect,
  Person,
  Database,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: insert`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)
    })

    beforeEach(async () => {
      await insertPersons(ctx, [
        {
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
          pets: [{ name: 'Catto', species: 'cat' }],
        },
        {
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
          pets: [{ name: 'Doggo', species: 'dog' }],
        },
        {
          first_name: 'Sylvester',
          last_name: 'Stallone',
          gender: 'male',
          pets: [{ name: 'Hammo', species: 'hamster' }],
        },
      ])
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should insert one row', async () => {
      const query = ctx.db
        .insertInto('person')
        .values({ first_name: 'Foo', last_name: 'Barson' })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name") values ($1, $2)',
          bindings: ['Foo', 'Barson'],
        },
      })

      const result = await query.executeTakeFirst()

      if (dialect === 'postgres') {
        expect(result).to.be.undefined
      }

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })

    it('should insert one row with complex values', async () => {
      const query = ctx.db.insertInto('person').values({
        first_name: ctx.db
          .selectFrom('person')
          .select(ctx.db.raw('max(first_name)').as('max_first_name')),
        last_name: ctx.db.raw(
          'concat(cast(? as varchar), cast(? as varchar))',
          ['Bar', 'son']
        ),
      })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name") values ((select max(first_name) as "max_first_name" from "person"), concat(cast($1 as varchar), cast($2 as varchar)))',
          bindings: ['Bar', 'son'],
        },
      })

      const result = await query.executeTakeFirst()

      if (dialect === 'postgres') {
        expect(result).to.be.undefined
      }

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Sylvester',
        last_name: 'Barson',
      })
    })

    it('should insert one row and ignore conflicts using onConflictDoNothing', async () => {
      const [{ name }] = await ctx.db.selectFrom('pet').select('name').execute()

      const query = ctx.db
        .insertInto('pet')
        .values({ name })
        .onConflictDoNothing('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name") values ($1) on conflict ("name") do nothing',
          bindings: ['Catto'],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.undefined
    })

    it('should update instead of insert on conflict when using onConfictUpdate', async () => {
      const query = ctx.db
        .insertInto('pet')
        .values({ name: 'Catto' })
        .onConflictUpdate('name', { species: 'hamster' })
        .returningAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name") values ($1) on conflict ("name") do update set "species" = $2 returning *',
          bindings: ['Catto', 'hamster'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.containSubset({
        name: 'Catto',
        species: 'hamster',
      })
    })

    if (dialect === 'postgres') {
      it('should insert multiple rows', async () => {
        const query = ctx.db
          .insertInto('person')
          .values([
            { first_name: 'Foo', last_name: 'Barson' },
            { first_name: 'Baz', last_name: 'Spam' },
          ])
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("first_name", "last_name") values ($1, $2), ($3, $4) returning *',
            bindings: ['Foo', 'Barson', 'Baz', 'Spam'],
          },
        })

        const result = await query.execute()
        expect(result).to.have.length(2)
      })

      it('should return data using `returning`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(ctx.db.raw('max(first_name)').as('max_first_name')),
            last_name: ctx.db.raw(
              'concat(cast(? as varchar), cast(? as varchar))',
              ['Bar', 'son']
            ),
          })
          .returning(['first_name', 'last_name', 'gender'])
          .executeTakeFirst()

        expect(result).to.eql({
          first_name: 'Sylvester',
          last_name: 'Barson',
          gender: 'other',
        })

        expect(await getNewestPerson(ctx.db)).to.eql({
          first_name: 'Sylvester',
          last_name: 'Barson',
        })
      })

      it('should return data using `returningAll`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(ctx.db.raw('max(first_name)').as('max_first_name')),
            last_name: ctx.db.raw(
              'concat(cast(? as varchar), cast(? as varchar))',
              ['Bar', 'son']
            ),
          })
          .returningAll()
          .executeTakeFirst()

        expect(result).to.containSubset({
          first_name: 'Sylvester',
          last_name: 'Barson',
          gender: 'other',
        })

        expect(await getNewestPerson(ctx.db)).to.eql({
          first_name: 'Sylvester',
          last_name: 'Barson',
        })
      })
    }
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
        db.selectFrom('person').select(db.raw('max(id)').as('max_id'))
      )
      .executeTakeFirst()
  }
}
