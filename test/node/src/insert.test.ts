import { AliasedRawBuilder, InsertResult, Kysely, sql } from '../../../'

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
  limit,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: insert`, () => {
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
      const query = ctx.db.insertInto('person').values({
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
        mssql: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
          parameters: ['Foo', 'Barson', 'other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
          parameters: ['Foo', 'Barson', 'other'],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.instanceOf(InsertResult)
      expect(result.numInsertedOrUpdatedRows).to.equal(1n)

      if (dialect === 'postgres' || dialect === 'mssql') {
        expect(result.insertId).to.be.undefined
      } else {
        expect(result.insertId).to.be.a('bigint')
      }

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })

    it('should insert one row with default values', async () => {
      const query = ctx.db.insertInto('person').defaultValues()

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" default values',
          parameters: [],
        },
        mysql: {
          sql: 'insert into `person` default values',
          parameters: [],
        },
        mssql: {
          sql: 'insert into "person" default values',
          parameters: [],
        },
        sqlite: {
          sql: 'insert into "person" default values',
          parameters: [],
        },
      })
    })

    it('should insert one row with complex values', async () => {
      const query = ctx.db.insertInto('person').values({
        first_name: ctx.db
          .selectFrom('pet')
          .select(sql<string>`max(name)`.as('max_name')),
        last_name:
          dialect === 'sqlite'
            ? sql`'Bar' || 'son'`
            : sql`concat('Bar', 'son')`,
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
        mssql: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values ((select max(name) as "max_name" from "pet"), concat('Bar', 'son'), @1)`,
          parameters: ['other'],
        },
        sqlite: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values ((select max(name) as "max_name" from "pet"), 'Bar' || 'son', ?)`,
          parameters: ['other'],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.instanceOf(InsertResult)
      expect(result.numInsertedOrUpdatedRows).to.equal(1n)

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Hammo',
        last_name: 'Barson',
      })
    })

    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'sqlite') {
      it('should insert one row with expressions', async () => {
        const query = ctx.db.insertInto('person').values(({ selectFrom }) => ({
          first_name: selectFrom('pet')
            .select('name')
            .where('species', '=', 'dog')
            .limit(1),
          gender: 'female',
        }))

        testSql(query, dialect, {
          postgres: {
            sql: `insert into "person" ("first_name", "gender") values ((select "name" from "pet" where "species" = $1 limit $2), $3)`,
            parameters: ['dog', 1, 'female'],
          },
          mysql: {
            sql: 'insert into `person` (`first_name`, `gender`) values ((select `name` from `pet` where `species` = ? limit ?), ?)',
            parameters: ['dog', 1, 'female'],
          },
          sqlite: {
            sql: `insert into "person" ("first_name", "gender") values ((select "name" from "pet" where "species" = ? limit ?), ?)`,
            parameters: ['dog', 1, 'female'],
          },
          mssql: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()
        expect(result).to.be.instanceOf(InsertResult)
        expect(result.numInsertedOrUpdatedRows).to.equal(1n)

        expect(await getNewestPerson(ctx.db)).to.eql({
          first_name: 'Doggo',
          last_name: null,
        })
      })
    }

    it('should insert the result of a select query', async () => {
      const query = ctx.db
        .insertInto('person')
        .columns(['first_name', 'gender'])
        .expression((eb) =>
          eb.selectFrom('pet').select(['name', eb.val('other').as('gender')]),
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "gender") select "name", $1 as "gender" from "pet"',
          parameters: ['other'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `gender`) select `name`, ? as `gender` from `pet`',
          parameters: ['other'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "gender") select "name", @1 as "gender" from "pet"',
          parameters: ['other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "gender") select "name", ? as "gender" from "pet"',
          parameters: ['other'],
        },
      })

      const result = await query.executeTakeFirst()
      expect(result).to.be.instanceOf(InsertResult)

      const { pet_count } = await ctx.db
        .selectFrom('pet')
        .select(sql<string | number | bigint>`count(*)`.as('pet_count'))
        .executeTakeFirstOrThrow()

      expect(result.numInsertedOrUpdatedRows).to.equal(BigInt(pet_count))

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

    if (dialect === 'postgres' || dialect === 'mssql') {
      it('should insert the result of a values expression', async () => {
        const query = ctx.db
          .insertInto('person')
          .columns(['first_name', 'gender'])
          .expression(
            ctx.db
              .selectFrom(
                values(
                  [
                    { a: 1, b: 'foo' },
                    { a: 2, b: 'bar' },
                  ],
                  't',
                ),
              )
              .select(['t.a', 't.b']),
          )
          .$call((qb) =>
            dialect === 'postgres'
              ? qb.returning(['first_name', 'gender'])
              : qb.output(['inserted.first_name', 'inserted.gender']),
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("first_name", "gender") select "t"."a", "t"."b" from (values ($1, $2), ($3, $4)) as t(a, b) returning "first_name", "gender"',
            parameters: [1, 'foo', 2, 'bar'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'insert into "person" ("first_name", "gender") output "inserted"."first_name", "inserted"."gender" select "t"."a", "t"."b" from (values (@1, @2), (@3, @4)) as t(a, b)',
            parameters: [1, 'foo', 2, 'bar'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(result).to.deep.equal([
          { first_name: '1', gender: 'foo' },
          { first_name: '2', gender: 'bar' },
        ])
      })
    }

    it('undefined values should be ignored', async () => {
      const query = ctx.db.insertInto('person').values({
        id: undefined,
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
        mssql: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
          parameters: ['Foo', 'Barson', 'other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
          parameters: ['Foo', 'Barson', 'other'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(InsertResult)
      expect(result.numInsertedOrUpdatedRows).to.equal(1n)

      if (dialect === 'postgres' || dialect === 'mssql') {
        expect(result.insertId).to.be.undefined
      } else {
        expect(result.insertId).to.be.a('bigint')
      }
    })

    if (dialect === 'mysql') {
      it('should insert one row and ignore conflicts using insert ignore', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db.insertInto('pet').ignore().values(existingPet)

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
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.insertId).to.be.undefined
        expect(result.numInsertedOrUpdatedRows).to.equal(0n)
      })
    }

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should insert one row and ignore conflicts using `on conflict do nothing`', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
          .onConflict((oc) => oc.column('name').doNothing())

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict ("name") do nothing',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
            ],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'insert into "pet" ("name", "owner_id", "species") values (?, ?, ?) on conflict ("name") do nothing',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
            ],
          },
          mysql: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.numInsertedOrUpdatedRows).to.equal(0n)

        if (dialect === 'sqlite') {
          // SQLite seems to return the last inserted id even if nothing got inserted.
          expect(result.insertId! > 0n).to.be.equal(true)
        } else {
          expect(result.insertId).to.be.undefined
        }
      })
    }

    if (dialect === 'postgres') {
      it('should insert one row and ignore conflicts using `on conflict on constraint do nothing`', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
          .onConflict((oc) => oc.constraint('pet_name_key').doNothing())

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
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.insertId).to.be.undefined
        expect(result.numInsertedOrUpdatedRows).to.equal(0n)
      })
    }

    if (dialect === 'mysql') {
      it('should update instead of insert on conflict when using onDuplicateKeyUpdate', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
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
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.insertId).to.equal(BigInt(id))
        expect(result.numInsertedOrUpdatedRows).to.equal(2n)

        const updatedPet = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirstOrThrow()

        expect(updatedPet).to.containSubset({
          name: 'Catto',
          species: 'hamster',
        })
      })
    }

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should update instead of insert on conflict when using `on conflict do update`', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
          .onConflict((oc) =>
            oc.columns(['name']).doUpdateSet({ species: 'hamster' }),
          )

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
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'insert into "pet" ("name", "owner_id", "species") values (?, ?, ?) on conflict ("name") do update set "species" = ?',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
              'hamster',
            ],
          },
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.numInsertedOrUpdatedRows).to.equal(1n)

        if (dialect === 'postgres') {
          expect(result.insertId).to.be.undefined
        } else {
          expect(result.insertId).to.be.a('bigint')
        }

        const updatedPet = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirstOrThrow()

        expect(updatedPet).to.containSubset({
          name: 'Catto',
          species: 'hamster',
        })
      })
    }

    if (dialect === 'postgres') {
      it('should update instead of insert on conflict when using `on conflict on constraint do update`', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
          .onConflict((oc) =>
            oc.constraint('pet_name_key').doUpdateSet({ species: 'hamster' }),
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
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.containSubset({
          name: 'Catto',
          species: 'hamster',
        })
      })

      it('should update instead of insert on conflict when using `on conflict do update where`', async () => {
        const [{ id, ...existingPet }] = await ctx.db
          .selectFrom('pet')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .insertInto('pet')
          .values(existingPet)
          .onConflict((oc) =>
            oc
              .column('name')
              .where('name', '=', 'Catto')
              .doUpdateSet({
                species: 'hamster',
                name: (eb) => eb.ref('excluded.name'),
              })
              .where('excluded.name', '!=', 'Doggo'),
          )
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "pet" ("name", "owner_id", "species") values ($1, $2, $3) on conflict ("name") where "name" = $4 do update set "species" = $5, "name" = "excluded"."name" where "excluded"."name" != $6 returning *',
            parameters: [
              existingPet.name,
              existingPet.owner_id,
              existingPet.species,
              'Catto',
              'hamster',
              'Doggo',
            ],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.have.length(1)
        expect(result[0]).to.containSubset({
          species: 'hamster',
          name: 'Catto',
        })
      })
    }

    it('should insert multiple rows', async () => {
      const query = ctx.db.insertInto('person').values([
        {
          first_name: 'Foo',
          last_name: 'Bar',
          gender: 'other',
        },
        {
          first_name: 'Baz',
          last_name: 'Spam',
          gender: 'other',
        },
      ])

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3), ($4, $5, $6)',
          parameters: ['Foo', 'Bar', 'other', 'Baz', 'Spam', 'other'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?), (?, ?, ?)',
          parameters: ['Foo', 'Bar', 'other', 'Baz', 'Spam', 'other'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3), (@4, @5, @6)',
          parameters: ['Foo', 'Bar', 'other', 'Baz', 'Spam', 'other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?), (?, ?, ?)',
          parameters: ['Foo', 'Bar', 'other', 'Baz', 'Spam', 'other'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(InsertResult)
      expect(result.numInsertedOrUpdatedRows).to.equal(2n)

      if (dialect === 'postgres' || dialect === 'mssql') {
        expect(result.insertId).to.be.undefined
      } else {
        expect(result.insertId).to.be.a('bigint')
      }

      const inserted = await ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('id', 'desc')
        .$call(limit(2, dialect))
        .execute()

      expect(inserted).to.containSubset([
        { first_name: 'Foo', last_name: 'Bar', gender: 'other' },
        { first_name: 'Baz', last_name: 'Spam', gender: 'other' },
      ])
    })

    it('should insert multiple rows while falling back to default values in partial rows - missing columns', async () => {
      const query = ctx.db.insertInto('person').values([
        {
          first_name: 'Foo',
          // last_name is missing on purpose
          // middle_name is missing on purpose
          gender: 'other',
        },
        {
          first_name: 'Baz',
          last_name: 'Spam',
          middle_name: 'Bo',
          gender: 'other',
        },
      ])

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "gender", "last_name", "middle_name") values ($1, $2, default, default), ($3, $4, $5, $6)',
          parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `gender`, `last_name`, `middle_name`) values (?, ?, default, default), (?, ?, ?, ?)',
          parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "gender", "last_name", "middle_name") values (@1, @2, default, default), (@3, @4, @5, @6)',
          parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "gender", "last_name", "middle_name") values (?, ?, null, null), (?, ?, ?, ?)',
          parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
        },
      })

      await query.execute()
    })

    it('should insert multiple rows while falling back to default values in partial rows - undefined columns', async () => {
      const query = ctx.db.insertInto('person').values([
        {
          first_name: 'Foo',
          last_name: 'Spam',
          middle_name: undefined,
          gender: 'other',
        },
        {
          first_name: 'Baz',
          last_name: undefined,
          middle_name: undefined,
          gender: 'other',
        },
      ])

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "last_name", "middle_name", "gender") values ($1, $2, default, $3), ($4, default, default, $5)',
          parameters: ['Foo', 'Spam', 'other', 'Baz', 'other'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `last_name`, `middle_name`, `gender`) values (?, ?, default, ?), (?, default, default, ?)',
          parameters: ['Foo', 'Spam', 'other', 'Baz', 'other'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "last_name", "middle_name", "gender") values (@1, @2, default, @3), (@4, default, default, @5)',
          parameters: ['Foo', 'Spam', 'other', 'Baz', 'other'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "middle_name", "gender") values (?, ?, null, ?), (?, null, null, ?)',
          parameters: ['Foo', 'Spam', 'other', 'Baz', 'other'],
        },
      })

      await query.execute()
    })

    it('should insert multiple rows while falling back to default values in partial rows - undefined/missing columns', async () => {
      const query = ctx.db.insertInto('person').values([
        {
          first_name: 'Foo',
          // last_name missing on purpose
          middle_name: 'Bo',
          gender: 'other',
        },
        {
          first_name: 'Baz',
          last_name: 'Spam',
          middle_name: undefined,
          gender: 'other',
        },
      ])

      testSql(query, dialect, {
        postgres: {
          sql: 'insert into "person" ("first_name", "middle_name", "gender", "last_name") values ($1, $2, $3, default), ($4, default, $5, $6)',
          parameters: ['Foo', 'Bo', 'other', 'Baz', 'other', 'Spam'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `middle_name`, `gender`, `last_name`) values (?, ?, ?, default), (?, default, ?, ?)',
          parameters: ['Foo', 'Bo', 'other', 'Baz', 'other', 'Spam'],
        },
        mssql: {
          sql: 'insert into "person" ("first_name", "middle_name", "gender", "last_name") values (@1, @2, @3, default), (@4, default, @5, @6)',
          parameters: ['Foo', 'Bo', 'other', 'Baz', 'other', 'Spam'],
        },
        sqlite: {
          sql: 'insert into "person" ("first_name", "middle_name", "gender", "last_name") values (?, ?, ?, null), (?, null, ?, ?)',
          parameters: ['Foo', 'Bo', 'other', 'Baz', 'other', 'Spam'],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should insert a row and return data using `returning`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(sql<string>`max(first_name)`.as('max_first_name')),
            last_name:
              dialect === 'postgres'
                ? sql`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`
                : sql`cast(${'Bar'} as varchar) || cast(${'son'} as varchar)`,
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

      it('should insert a row, returning some fields of inserted row and conditionally returning additional fields', async () => {
        const condition = true

        const query = ctx.db
          .insertInto('person')
          .values({
            first_name: 'Foo',
            last_name: 'Barson',
            gender: 'other',
          })
          .returning('first_name')
          .$if(condition, (qb) => qb.returning('last_name'))

        const result = await query.executeTakeFirstOrThrow()

        expect(result.last_name).to.equal('Barson')
      })

      it('should insert a row and return data using `returningAll`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(sql<string>`max(first_name)`.as('max_first_name')),
            last_name:
              dialect === 'postgres'
                ? sql`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`
                : sql`cast(${'Bar'} as varchar) || cast(${'son'} as varchar)`,
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

    if (dialect === 'postgres' || dialect === 'mysql') {
      it('modifyEnd should add arbitrary SQL to the end of the query', async () => {
        const query = ctx.db
          .insertInto('person')
          .values({
            gender: 'other',
          })
          .modifyEnd(sql.raw('-- this is a comment'))

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("gender") values ($1) -- this is a comment',
            parameters: ['other'],
          },
          mysql: {
            sql: 'insert into `person` (`gender`) values (?) -- this is a comment',
            parameters: ['other'],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.have.length(1)
      })
    }

    if (dialect === 'postgres') {
      it('should insert multiple rows and stream returned results', async () => {
        const values = [
          {
            first_name: 'Moses',
            last_name: 'Malone',
            gender: 'male',
          },
          {
            first_name: 'Erykah',
            last_name: 'Badu',
            gender: 'female',
          },
        ] as const

        const stream = ctx.db
          .insertInto('person')
          .values(values)
          .returning(['first_name', 'last_name', 'gender'])
          .stream()

        const people = []

        for await (const person of stream) {
          people.push(person)
        }

        expect(people).to.have.length(values.length)
        expect(people).to.eql(values)
      })
    }

    if (dialect === 'mssql') {
      it('should insert top', async () => {
        const query = ctx.db
          .insertInto('person')
          .top(1)
          .columns(['first_name', 'gender'])
          .expression((eb) =>
            eb.selectFrom('pet').select(['name', eb.val('other').as('gender')]),
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'insert top(1) into "person" ("first_name", "gender") select "name", @1 as "gender" from "pet"',
            parameters: ['other'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.executeTakeFirstOrThrow()
      })

      it('should insert top percent', async () => {
        const query = ctx.db
          .insertInto('person')
          .top(50, 'percent')
          .columns(['first_name', 'gender'])
          .expression((eb) =>
            eb.selectFrom('pet').select(['name', eb.val('other').as('gender')]),
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'insert top(50) percent into "person" ("first_name", "gender") select "name", @1 as "gender" from "pet"',
            parameters: ['other'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.executeTakeFirstOrThrow()
      })
    }

    if (dialect === 'mssql') {
      it('should insert a row and return data using `output`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .output([
            'inserted.first_name',
            'inserted.last_name',
            'inserted.gender',
          ])
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(sql<string>`max(first_name)`.as('max_first_name')),
            last_name: sql`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`,
          })
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

      it('should insert a row, returning some fields of inserted row and conditionally returning additional fields', async () => {
        const condition = true

        const query = ctx.db
          .insertInto('person')
          .output('inserted.first_name')
          .$if(condition, (qb) => qb.output('inserted.last_name'))
          .values({
            first_name: 'Foo',
            last_name: 'Barson',
            gender: 'other',
          })

        const result = await query.executeTakeFirstOrThrow()

        expect(result.last_name).to.equal('Barson')
      })

      it('should insert a row and return data using `outputAll`', async () => {
        const result = await ctx.db
          .insertInto('person')
          .outputAll('inserted')
          .values({
            gender: 'other',
            first_name: ctx.db
              .selectFrom('person')
              .select(sql<string>`max(first_name)`.as('max_first_name')),
            last_name: sql`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`,
          })
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
    db: Kysely<Database>,
  ): Promise<Pick<Person, 'first_name' | 'last_name'> | undefined> {
    return await db
      .selectFrom('person')
      .select(['first_name', 'last_name'])
      .where(
        'id',
        '=',
        db.selectFrom('person').select(sql<number>`max(id)`.as('max_id')),
      )
      .executeTakeFirst()
  }
}

function values<R extends Record<string, unknown>, A extends string>(
  records: R[],
  alias: A,
): AliasedRawBuilder<R, A> {
  const keys = Object.keys(records[0])

  const values = sql.join(
    records.map((r) => {
      const v = sql.join(keys.map((k) => sql`${r[k]}`))
      return sql`(${v})`
    }),
  )

  return sql<R>`(values ${values})`.as<A>(
    sql.raw(`${alias}(${keys.join(', ')})`),
  )
}
