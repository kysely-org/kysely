import { Kysely } from '../../'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  Person,
  Database,
  NOT_SUPPORTED,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: insert`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
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
      const query = ctx.db.insertInto('person').values({
        id: ctx.db.generated,
        first_name: 'Foo',
        last_name: 'Barson',
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
          parameters: ['Foo', 'Barson', 'other'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
          parameters: ['Foo', 'Barson', 'other'],
        },
      })

      const result = await query.executeTakeFirst()

      if (dialect === 'postgres') {
        expect(result).to.be.undefined
      } else {
        expect(result).to.be.a('number')
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
          .selectFrom('pet')
          .select(ctx.db.raw('max(name)').as('max_name')),
        last_name: ctx.db.raw("concat('Bar', 'son')"),
        gender: 'other',
      })

      testSql(query, dialect, {
        postgres: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values ((select max(name) as "max_name" from "pet"), concat('Bar', 'son'), $1)`,
          parameters: ['other'],
        },
        mysql: {
          sql: "insert into `person` (`first_name`, `last_name`, `gender`) values ((select max(name) as `max_name` from `pet`), concat('Bar', 'son'), ?)",
          parameters: ['other'],
        },
      })

      const result = await query.executeTakeFirst()

      if (dialect === 'postgres') {
        expect(result).to.be.undefined
      } else {
        expect(result).to.be.a('number')
      }

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Hammo',
        last_name: 'Barson',
      })
    })

    if (dialect === 'mysql') {
      it('should insert one row and ignore conflicts using insert ignore', async () => {
        const [existingPet] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .ignore()
          .values({ ...existingPet, id: ctx.db.generated })

        testSql(query, dialect, {
          mysql: {
            sql: 'insert ignore into `pet` (`name`, `owner_id`, `species`) values (?, ?, ?)',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
            ],
          },
          postgres: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()
        expect(result).to.be.undefined
      })
    } else {
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
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
            ],
          },
          mysql: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()
        expect(result).to.be.undefined
      })
    }

    if (dialect === 'postgres') {
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
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
            ],
          },
          mysql: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()
        expect(result).to.be.undefined
      })
    }

    if (dialect === 'mysql') {
      it('should update instead of insert on conflict when using onDuplicateKeyUpdate', async () => {
        const [existingPet] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values({ ...existingPet, id: ctx.db.generated })
          .onDuplicateKeyUpdate({ species: 'hamster' })

        testSql(query, dialect, {
          mysql: {
            sql: 'insert into `pet` (`name`, `owner_id`, `species`) values (?, ?, ?) on duplicate key update `species` = ?',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
              'hamster',
            ],
          },
          postgres: NOT_SUPPORTED,
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
    } else {
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

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict ("name") do update set "species" = $4',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
              'hamster',
            ],
          },
          mysql: NOT_SUPPORTED,
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
    }

    if (dialect === 'postgres') {
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
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
              'hamster',
            ],
          },
          mysql: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.containSubset({
          name: 'Catto',
          species: 'hamster',
        })
      })

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
            parameters: ['Foo', 'Barson', 'other', 'Baz', 'Spam', 'other'],
          },
          mysql: {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values ($1, $2, $3), ($4, $5, $6) returning *',
            parameters: ['Foo', 'Barson', 'other', 'Baz', 'Spam', 'other'],
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
