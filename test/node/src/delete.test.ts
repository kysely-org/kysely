import { DeleteResult, sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  insertDefaultDataSet,
  DEFAULT_DATA_SET,
  DIALECTS,
  Species,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: delete`, () => {
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

    it('should delete one row', async () => {
      const query = ctx.db.deleteFrom('person').where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'delete from "person" where "gender" = $1',
          parameters: ['female'],
        },
        mysql: {
          sql: 'delete from `person` where `gender` = ?',
          parameters: ['female'],
        },
        mssql: {
          sql: 'delete from "person" where "gender" = @1',
          parameters: ['female'],
        },
        sqlite: {
          sql: 'delete from "person" where "gender" = ?',
          parameters: ['female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(1n)

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute(),
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    it('should delete two rows', async () => {
      const query = ctx.db
        .deleteFrom('person')
        .where((eb) =>
          eb.or([
            eb('first_name', '=', 'Jennifer'),
            eb('first_name', '=', 'Arnold'),
          ]),
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'delete from "person" where ("first_name" = $1 or "first_name" = $2)',
          parameters: ['Jennifer', 'Arnold'],
        },
        mysql: {
          sql: 'delete from `person` where (`first_name` = ? or `first_name` = ?)',
          parameters: ['Jennifer', 'Arnold'],
        },
        mssql: {
          sql: 'delete from "person" where ("first_name" = @1 or "first_name" = @2)',
          parameters: ['Jennifer', 'Arnold'],
        },
        sqlite: {
          sql: 'delete from "person" where ("first_name" = ? or "first_name" = ?)',
          parameters: ['Jennifer', 'Arnold'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(2n)
    })

    it('should delete zero rows', async () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('first_name', '=', 'Nobody')

      testSql(query, dialect, {
        postgres: {
          sql: 'delete from "person" where "first_name" = $1',
          parameters: ['Nobody'],
        },
        mysql: {
          sql: 'delete from `person` where `first_name` = ?',
          parameters: ['Nobody'],
        },
        mssql: {
          sql: 'delete from "person" where "first_name" = @1',
          parameters: ['Nobody'],
        },
        sqlite: {
          sql: 'delete from "person" where "first_name" = ?',
          parameters: ['Nobody'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(0n)
    })

    if (dialect === 'mysql') {
      it('should order and limit the deleted rows', async () => {
        const query = ctx.db.deleteFrom('person').orderBy('first_name').limit(2)

        testSql(query, dialect, {
          mysql: {
            sql: 'delete from `person` order by `first_name` limit ?',
            parameters: [2],
          },
          postgres: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirst()

        expect(result).to.be.instanceOf(DeleteResult)
        expect(result.numDeletedRows).to.equal(2n)
      })
    }

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should return deleted rows when `returning` is used', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .returning(['first_name', 'last_name as last'])

        testSql(query, dialect, {
          postgres: {
            sql: 'delete from "person" where "gender" = $1 returning "first_name", "last_name" as "last"',
            parameters: ['male'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'delete from "person" where "gender" = ? returning "first_name", "last_name" as "last"',
            parameters: ['male'],
          },
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(Object.keys(result[0]).sort()).to.eql(['first_name', 'last'])
        expect(result).to.containSubset([
          { first_name: 'Arnold', last: 'Schwarzenegger' },
          { first_name: 'Sylvester', last: 'Stallone' },
        ])
      })

      it('conditional returning statement should add optional fields', async () => {
        const condition = true

        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'female')
          .returning('first_name')
          .$if(condition, (qb) => qb.returning('last_name'))

        testSql(query, dialect, {
          postgres: {
            sql: 'delete from "person" where "gender" = $1 returning "first_name", "last_name"',
            parameters: ['female'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: 'delete from "person" where "gender" = ? returning "first_name", "last_name"',
            parameters: ['female'],
          },
        })

        const result = await query.executeTakeFirstOrThrow()
        expect(result.last_name).to.equal('Aniston')
      })
    }

    if (dialect === 'postgres') {
      it('should delete from t1 using t2', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using('pet')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('pet.species', '=', sql<Species>`${'NO_SUCH_SPECIES'}`)

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "person"',
              'using "pet"',
              'where "pet"."owner_id" = "person"."id"',
              'and "pet"."species" = $1',
            ],
            parameters: ['NO_SUCH_SPECIES'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using(['pet', 'toy'])
          .whereRef('pet.owner_id', '=', 'person.id')
          .whereRef('toy.pet_id', '=', 'pet.id')
          .where('toy.price', '=', 0)

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "person"',
              'using "pet", "toy"',
              'where "pet"."owner_id" = "person"."id"',
              'and "toy"."pet_id" = "pet"."id"',
              'and "toy"."price" = $1',
            ],
            parameters: [0],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3 returning t2.column', async () => {
        const query = ctx.db
          .deleteFrom('toy')
          .using(['pet', 'person'])
          .whereRef('toy.pet_id', '=', 'pet.id')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Bob')
          .returning('pet.name')

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "toy"',
              'using "pet", "person"',
              'where "toy"."pet_id" = "pet"."id"',
              'and "pet"."owner_id" = "person"."id"',
              'and "person"."first_name" = $1',
              'returning "pet"."name"',
            ],
            parameters: ['Bob'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 returning *', async () => {
        const query = ctx.db
          .deleteFrom('pet')
          .where('pet.species', '=', 'cat')
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "pet"',
              'where "pet"."species" = $1',
              'returning *',
            ],
            parameters: ['cat'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3 returning *', async () => {
        const query = ctx.db
          .deleteFrom('toy')
          .using(['pet', 'person'])
          .whereRef('toy.pet_id', '=', 'pet.id')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Zoro')
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "toy"',
              'using "pet", "person"',
              'where "toy"."pet_id" = "pet"."id"',
              'and "pet"."owner_id" = "person"."id"',
              'and "person"."first_name" = $1',
              'returning *',
            ],
            parameters: ['Zoro'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3 returning t1.*, t2.*', async () => {
        const query = ctx.db
          .deleteFrom('toy')
          .using(['pet', 'person'])
          .whereRef('toy.pet_id', '=', 'pet.id')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Luffy')
          .returningAll(['toy', 'pet'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "toy"',
              'using "pet", "person"',
              'where "toy"."pet_id" = "pet"."id"',
              'and "pet"."owner_id" = "person"."id"',
              'and "person"."first_name" = $1',
              'returning "toy".*, "pet".*',
            ],
            parameters: ['Luffy'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3 returning t2.*', async () => {
        const query = ctx.db
          .deleteFrom('toy')
          .using(['pet', 'person'])
          .whereRef('toy.pet_id', '=', 'pet.id')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Itachi')
          .returningAll('pet')

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "toy"',
              'using "pet", "person"',
              'where "toy"."pet_id" = "pet"."id"',
              'and "pet"."owner_id" = "person"."id"',
              'and "person"."first_name" = $1',
              'returning "pet".*',
            ],
            parameters: ['Itachi'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 returning t1.*', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .returningAll('person')

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "person"',
              'where "gender" = $1',
              'returning "person".*',
            ],
            parameters: ['male'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 returning *', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: ['delete from "person"', 'where "gender" = $1', 'returning *'],
            parameters: ['male'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t2, t3 returning *', async () => {
        const query = ctx.db
          .deleteFrom('toy')
          .using(['pet', 'person'])
          .whereRef('toy.pet_id', '=', 'pet.id')
          .whereRef('pet.owner_id', '=', 'person.id')
          .where('person.first_name', '=', 'Bob')
          .returningAll()

        testSql(query, dialect, {
          postgres: {
            sql: [
              'delete from "toy"',
              'using "pet", "person"',
              'where "toy"."pet_id" = "pet"."id"',
              'and "pet"."owner_id" = "person"."id"',
              'and "person"."first_name" = $1',
              'returning *',
            ],
            parameters: ['Bob'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    if (dialect === 'mysql') {
      it('should delete from t1 using t1 inner join t2', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .where('pet.species', '=', sql<Species>`${'NO_SUCH_SPECIES'}`)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'where `pet`.`species` = ?',
            ],
            parameters: ['NO_SUCH_SPECIES'],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t1 left join t2', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .where('pet.species', '=', sql<Species>`${'NO_SUCH_SPECIES'}`)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`',
              'using `person`',
              'left join `pet` on `pet`.`owner_id` = `person`.`id`',
              'where `pet`.`species` = ?',
            ],
            parameters: ['NO_SUCH_SPECIES'],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t1 inner join t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where(({ eb, or }) =>
            or([
              eb('pet.species', '=', sql<Species>`${'NO_SUCH_SPECIES'}`),
              eb('toy.price', '=', 0),
            ]),
          )

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: 'delete from `person` using `person` inner join `pet` on `pet`.`owner_id` = `person`.`id` left join `toy` on `toy`.`pet_id` = `pet`.`id` where (`pet`.`species` = ? or `toy`.`price` = ?)',
            parameters: ['NO_SUCH_SPECIES', 0],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t1, t2', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using(['person', 'pet'])
          .where('pet.species', '=', sql<Species>`${'NO_SUCH_SPECIES'}`)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`',
              'using `person`, `pet`',
              'where `pet`.`species` = ?',
            ],
            parameters: ['NO_SUCH_SPECIES'],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t1, t2 inner join t3', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using(['person', 'pet'])
          .innerJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 0)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`',
              'using `person`, `pet`',
              'inner join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [0],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1 using t1, t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .using(['person', 'pet'])
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 0)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`',
              'using `person`, `pet`',
              'left join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [0],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2 using t1 inner join t2', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet'])
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .where('person.id', '=', 911)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'where `person`.`id` = ?',
            ],
            parameters: [911],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2 using t1 left join t2', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet'])
          .using('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .where('person.id', '=', 911)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`',
              'using `person`',
              'left join `pet` on `pet`.`owner_id` = `person`.`id`',
              'where `person`.`id` = ?',
            ],
            parameters: [911],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2 using t1 inner join t2 inner join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet'])
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .innerJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'inner join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2 using t1 inner join t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet'])
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'left join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2 using t1 left join t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet'])
          .using('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`',
              'using `person`',
              'left join `pet` on `pet`.`owner_id` = `person`.`id`',
              'left join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2, t3 using t1 inner join t2 inner join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet', 'toy'])
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .innerJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`, `toy`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'inner join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2, t3 using t1 inner join t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet', 'toy'])
          .using('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`, `toy`',
              'using `person`',
              'inner join `pet` on `pet`.`owner_id` = `person`.`id`',
              'left join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should delete from t1, t2, t3 using t1 left join t2 left join t3', async () => {
        const query = ctx.db
          .deleteFrom(['person', 'pet', 'toy'])
          .using('person')
          .leftJoin('pet', 'pet.owner_id', 'person.id')
          .leftJoin('toy', 'toy.pet_id', 'pet.id')
          .where('toy.price', '=', 1000)

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: {
            sql: [
              'delete from `person`, `pet`, `toy`',
              'using `person`',
              'left join `pet` on `pet`.`owner_id` = `person`.`id`',
              'left join `toy` on `toy`.`pet_id` = `pet`.`id`',
              'where `toy`.`price` = ?',
            ],
            parameters: [1000],
          },
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    if (dialect === 'postgres') {
      it('should delete all rows and stream returned results', async () => {
        const stream = ctx.db
          .deleteFrom('person')
          .returning(['first_name', 'last_name', 'gender'])
          .stream()

        const people = []

        for await (const person of stream) {
          people.push(person)
        }

        expect(people).to.have.length(DEFAULT_DATA_SET.length)
        expect(people).to.eql(
          DEFAULT_DATA_SET.map(({ first_name, last_name, gender }) => ({
            first_name,
            last_name,
            gender,
          })),
        )
      })
    }

    if (dialect === 'mssql') {
      it('should return deleted rows when `output` is used', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .output(['deleted.first_name', 'deleted.last_name as last'])
          .where('gender', '=', 'male')

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'delete from "person" output "deleted"."first_name", "deleted"."last_name" as "last" where "gender" = @1',
            parameters: ['male'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(Object.keys(result[0]).sort()).to.eql(['first_name', 'last'])
        expect(result).to.containSubset([
          { first_name: 'Arnold', last: 'Schwarzenegger' },
          { first_name: 'Sylvester', last: 'Stallone' },
        ])
      })

      it('conditional `output` statement should add optional fields', async () => {
        const condition = true

        const query = ctx.db
          .deleteFrom('person')
          .output('deleted.first_name')
          .$if(condition, (qb) => qb.output('deleted.last_name'))
          .where('gender', '=', 'female')

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'delete from "person" output "deleted"."first_name", "deleted"."last_name" where "gender" = @1',
            parameters: ['female'],
          },
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()
        expect(result.last_name).to.equal('Aniston')
      })
    }
  })
}
