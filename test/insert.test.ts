import { Kysely } from '../src'
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
} from './test-setup'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: tests for insert methods`, () => {
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
          sql:
            'insert into "person" ("first_name", "last_name") values ($1, $2)',
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
          sql:
            'insert into "person" ("first_name", "last_name") values ((select max(first_name) as "max_first_name" from "person"), concat(cast($1 as varchar), cast($2 as varchar)))',
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

    if (dialect === 'postgres') {
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
