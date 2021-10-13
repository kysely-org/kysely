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
      const query = ctx.db.insertInto('person').values({
        id: ctx.db.generated,
        first_name: 'Foo',
        last_name: 'Barson',
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
          bindings: ['Foo', 'Barson', 'other'],
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
        id: ctx.db.generated,
        first_name: ctx.db
          .selectFrom('person')
          .select(ctx.db.raw('max(first_name)').as('max_first_name')),
        last_name: ctx.db.raw(
          'concat(cast(? as varchar), cast(? as varchar))',
          ['Bar', 'son']
        ),
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ((select max(first_name) as "max_first_name" from "person"), concat(cast($1 as varchar), cast($2 as varchar)), $3)',
          bindings: ['Bar', 'son', 'other'],
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
      const [existingPet] = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .limit(1)
        .execute()

      const query = ctx.db
        .insertInto('pet')
        .values({ ...existingPet, id: ctx.db.generated })
        .onConflictDoNothing('name')

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict ("name") do nothing',
          bindings: [
            existingPet.name,
            existingPet.owner_id,
            existingPet.species,
          ],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.undefined
    })

    it('should insert one row and ignore conflicts using onConflictDoNothing and a constraint name', async () => {
      const [existingPet] = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .limit(1)
        .execute()

      const query = ctx.db
        .insertInto('pet')
        .values({ ...existingPet, id: ctx.db.generated })
        .onConflictDoNothing({ constraint: 'pet_name_key' })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict on constraint "pet_name_key" do nothing',
          bindings: [
            existingPet.name,
            existingPet.owner_id,
            existingPet.species,
          ],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.undefined
    })

    it('should update instead of insert on conflict when using onConfictUpdate', async () => {
      const [existingPet] = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .limit(1)
        .execute()

      const query = ctx.db
        .insertInto('pet')
        .values({ ...existingPet, id: ctx.db.generated })
        .onConflictUpdate('name', { species: 'hamster' })
        .returningAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict ("name") do update set "species" = $4 returning *',
          bindings: [
            existingPet.name,
            existingPet.owner_id,
            existingPet.species,
            'hamster',
          ],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.containSubset({
        name: 'Catto',
        species: 'hamster',
      })
    })

    it('should update instead of insert on conflict when using onConfictUpdate and a constraint name', async () => {
      const [existingPet] = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .limit(1)
        .execute()

      const query = ctx.db
        .insertInto('pet')
        .values({ ...existingPet, id: ctx.db.generated })
        .onConflictUpdate(
          { constraint: 'pet_name_key' },
          { species: 'hamster' }
        )
        .returningAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict on constraint "pet_name_key" do update set "species" = $4 returning *',
          bindings: [
            existingPet.name,
            existingPet.owner_id,
            existingPet.species,
            'hamster',
          ],
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
            {
              id: ctx.db.generated,
              first_name: 'Foo',
              last_name: 'Barson',
              gender: 'other',
            },
            {
              id: ctx.db.generated,
              first_name: 'Baz',
              last_name: 'Spam',
              gender: 'other',
            },
          ])
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3), ($4, $5, $6) returning *',
            bindings: ['Foo', 'Barson', 'other', 'Baz', 'Spam', 'other'],
          },
        })

        const result = await query.execute()
        expect(result).to.have.length(2)
      })

      it('should return data using `returning`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .values({
            id: ctx.db.generated,
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
            id: ctx.db.generated,
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
