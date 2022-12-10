import { AliasedRawBuilder, InsertResult, Kysely, sql } from '../../../'

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
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
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
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
          parameters: ['Foo', 'Barson', 'other'],
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

      expect(await getNewestPerson(ctx.db)).to.eql({
        first_name: 'Foo',
        last_name: 'Barson',
      })
    })

    it('should insert one row with complex values', async () => {
      const query = ctx.db.insertInto('person').values({
        first_name: ctx.db
          .selectFrom('pet')
          .select(sql<string>`max(name)`.as('max_name')),
        last_name:
          dialect === 'sqlite'
            ? sql<string>`'Bar' || 'son'`
            : sql<string>`concat('Bar', 'son')`,
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

    it('should insert the result of a select query', async () => {
      const query = ctx.db
        .insertInto('person')
        .columns(['first_name', 'gender'])
        .expression((eb) =>
          eb.selectFrom('pet').select(['name', sql`${'other'}`.as('gender')])
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

    if (dialect === 'postgres') {
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
                  't'
                )
              )
              .select(['t.a', 't.b'])
          )
          .returning(['first_name', 'gender'])

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("first_name", "gender") select "t"."a", "t"."b" from (values ($1, $2), ($3, $4)) as t(a, b) returning "first_name", "gender"',
            parameters: [1, 'foo', 2, 'bar'],
          },
          mysql: NOT_SUPPORTED,
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
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)',
          parameters: ['Foo', 'Barson', 'other'],
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
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(InsertResult)
        expect(result.insertId).to.be.undefined
        expect(result.numInsertedOrUpdatedRows).to.equal(0n)
      })
    }

    if (dialect !== 'mysql') {
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

    if (dialect !== 'mysql') {
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
            oc.columns(['name']).doUpdateSet({ species: 'hamster' })
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
            oc.constraint('pet_name_key').doUpdateSet({ species: 'hamster' })
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
              .where('excluded.name', '!=', 'Doggo')
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
        sqlite: {
          sql: 'insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?), (?, ?, ?)',
          parameters: ['Foo', 'Bar', 'other', 'Baz', 'Spam', 'other'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(InsertResult)
      expect(result.numInsertedOrUpdatedRows).to.equal(2n)

      if (dialect === 'postgres') {
        expect(result.insertId).to.be.undefined
      } else {
        expect(result.insertId).to.be.a('bigint')
      }

      const inserted = await ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('id', 'desc')
        .limit(2)
        .execute()

      expect(inserted).to.containSubset([
        { first_name: 'Foo', last_name: 'Bar', gender: 'other' },
        { first_name: 'Baz', last_name: 'Spam', gender: 'other' },
      ])
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should insert multiple rows while falling back to default values in partial rows', async () => {
        const query = ctx.db
          .insertInto('person')
          .values([
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
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "person" ("first_name", "gender", "last_name", "middle_name") values ($1, $2, default, default), ($3, $4, $5, $6) returning *',
            parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: {
            sql: 'insert into "person" ("first_name", "gender", "last_name", "middle_name") values (?, ?, null, null), (?, ?, ?, ?) returning *',
            parameters: ['Foo', 'other', 'Baz', 'other', 'Spam', 'Bo'],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(result).to.containSubset([
          { first_name: 'Foo', last_name: null, gender: 'other' },
          { first_name: 'Baz', last_name: 'Spam', gender: 'other' },
        ])
      })

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
                ? sql<string>`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`
                : sql<string>`cast(${'Bar'} as varchar) || cast(${'son'} as varchar)`,
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
            .if(condition, (qb) => qb.returning('last_name'))

          const result = await query.executeTakeFirstOrThrow()

          expect(result.last_name).to.equal('Barson')
        })
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
                ? sql<string>`concat(cast(${'Bar'} as varchar), cast(${'son'} as varchar))`
                : sql<string>`cast(${'Bar'} as varchar) || cast(${'son'} as varchar)`,
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
        db.selectFrom('person').select(sql<number>`max(id)`.as('max_id'))
      )
      .executeTakeFirst()
  }
}

function values<R extends Record<string, unknown>, A extends string>(
  records: R[],
  alias: A
): AliasedRawBuilder<R, A> {
  const keys = Object.keys(records[0])

  const values = sql.join(
    records.map((r) => {
      const v = sql.join(keys.map((k) => sql`${r[k]}`))
      return sql`(${v})`
    })
  )

  return sql<R>`(values ${values})`.as<A>(
    sql.raw(`${alias}(${keys.join(', ')})`)
  )
}
