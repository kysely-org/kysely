import { sql } from '../../../'

import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: where`, () => {
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

    describe('where', () => {
      it('a column name and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ?',
            parameters: ['Arnold'],
          },
        })

        const persons = await query.execute()

        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('a column name and a null value with `is not` operator', async () => {
        await ctx.db
          .updateTable('person')
          .set({ last_name: null })
          .where('first_name', '=', 'Jennifer')
          .execute()

        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('last_name', 'is not', null)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "last_name" is not null',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person` where `last_name` is not null',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person" where "last_name" is not null',
            parameters: [],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
      })

      it('a column name and a null value with `is` operator', async () => {
        await ctx.db
          .updateTable('person')
          .set({ last_name: null })
          .where('first_name', '=', 'Jennifer')
          .execute()

        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('last_name', 'is', null)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "last_name" is null',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person` where `last_name` is null',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person" where "last_name" is null',
            parameters: [],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].first_name).to.equal('Jennifer')
      })

      it('a dynamic column name and a primitive value', async () => {
        const { ref } = ctx.db.dynamic

        const columnName: string = 'first_name'
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(ref(columnName), '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ?',
            parameters: ['Arnold'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('table.column and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('person.first_name', '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "person"."first_name" = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where `person`.`first_name` = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where "person"."first_name" = ?',
            parameters: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person).to.containSubset({
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
        })
      })

      it('a raw instance and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(sql`person.first_name`, '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where person.first_name = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where person.first_name = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where person.first_name = ?',
            parameters: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person!.first_name).to.equal('Arnold')
      })

      it('a raw instance with bindings and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(sql`${sql.ref('person.first_name')}`, '=', 'Arnold')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "person"."first_name" = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where `person`.`first_name` = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where "person"."first_name" = ?',
            parameters: ['Arnold'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person!.first_name).to.equal('Arnold')
      })

      it('a raw instance and a boolean value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(sql`(first_name is null)`, 'is', false)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where (first_name is null) is false',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person` where (first_name is null) is false',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person" where (first_name is null) is false',
            parameters: [],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(3)
      })

      it('a subquery and a primitive value', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(
            (eb) =>
              eb
                .selectFrom('pet')
                .select('pet.name')
                .whereRef('owner_id', '=', 'person.id'),
            '=',
            'Catto'
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where (select "pet"."name" from "pet" where "owner_id" = "person"."id") = $1',
            parameters: ['Catto'],
          },
          mysql: {
            sql: 'select * from `person` where (select `pet`.`name` from `pet` where `owner_id` = `person`.`id`) = ?',
            parameters: ['Catto'],
          },
          sqlite: {
            sql: 'select * from "person" where (select "pet"."name" from "pet" where "owner_id" = "person"."id") = ?',
            parameters: ['Catto'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('a raw instance and a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(sql`${'Catto'}`, '=', (eb) =>
            eb
              .selectFrom('pet')
              .select('pet.name')
              .whereRef('owner_id', '=', 'person.id')
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where $1 = (select "pet"."name" from "pet" where "owner_id" = "person"."id")',
            parameters: ['Catto'],
          },
          mysql: {
            sql: 'select * from `person` where ? = (select `pet`.`name` from `pet` where `owner_id` = `person`.`id`)',
            parameters: ['Catto'],
          },
          sqlite: {
            sql: 'select * from "person" where ? = (select "pet"."name" from "pet" where "owner_id" = "person"."id")',
            parameters: ['Catto'],
          },
        })

        const person = await query.executeTakeFirst()
        expect(person).to.containSubset({
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
        })
      })

      it('a column name and a raw instance with a raw operator', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', sql`=`, sql`${'Arnold'}`)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1',
            parameters: ['Arnold'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ?',
            parameters: ['Arnold'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ?',
            parameters: ['Arnold'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons[0].id).to.be.a('number')
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('a `where in` query', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', 'in', ['Arnold', 'Jennifer'])
          .orderBy('first_name', 'desc')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" in ($1, $2) order by "first_name" desc',
            parameters: ['Arnold', 'Jennifer'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` in (?, ?) order by `first_name` desc',
            parameters: ['Arnold', 'Jennifer'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" in (?, ?) order by "first_name" desc',
            parameters: ['Arnold', 'Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons[0].first_name).to.equal('Jennifer')
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('two where expressions', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .where('person.last_name', '=', 'Schwarzenegger')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1 and "person"."last_name" = $2',
            parameters: ['Arnold', 'Schwarzenegger'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ? and `person`.`last_name` = ?',
            parameters: ['Arnold', 'Schwarzenegger'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ? and "person"."last_name" = ?',
            parameters: ['Arnold', 'Schwarzenegger'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
        ])
      })

      it('`and where` using the expression builder', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((eb) =>
            eb.and([
              eb('first_name', '=', 'Jennifer'),
              eb(eb.fn('upper', ['last_name']), '=', 'ANISTON'),
            ])
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 and upper("last_name") = $2)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? and upper(`last_name`) = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? and upper("last_name") = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('`and where` using the expression builder and chaining', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((eb) =>
            eb('first_name', '=', 'Jennifer').and(
              eb.fn('upper', ['last_name']),
              '=',
              'ANISTON'
            )
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 and upper("last_name") = $2)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? and upper(`last_name`) = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? and upper("last_name") = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('`and where` using the expression builder and a filter object', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((eb) =>
            eb.and({
              first_name: 'Jennifer',
              last_name: eb.fn<string>('upper', ['first_name']),
            })
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 and "last_name" = upper("first_name"))',
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? and `last_name` = upper(`first_name`))',
            parameters: ['Jennifer'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? and "last_name" = upper("first_name"))',
            parameters: ['Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(0)
      })

      it('`or where` using the expression builder', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(({ or, eb }) =>
            or([
              eb('first_name', '=', 'Jennifer'),
              eb(eb.fn('upper', ['last_name']), '=', 'ANISTON'),
            ])
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 or upper("last_name") = $2)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? or upper(`last_name`) = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? or upper("last_name") = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('`or where` using the expression builder and chaining', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((eb) =>
            eb('first_name', '=', 'Jennifer').or(
              eb.fn('upper', ['last_name']),
              '=',
              'ANISTON'
            )
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 or upper("last_name") = $2)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? or upper(`last_name`) = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? or upper("last_name") = ?)',
            parameters: ['Jennifer', 'ANISTON'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
        expect(persons).to.containSubset([
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('subquery exists', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(({ exists, selectFrom }) =>
            exists(
              selectFrom('pet')
                .select('pet.id')
                .whereRef('pet.owner_id', '=', 'person.id')
            )
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id")',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person` where exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id`)',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id")',
            parameters: [],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(3)
      })

      it('subquery not exists', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(({ not, exists, selectFrom }) =>
            not(
              exists(
                selectFrom('pet')
                  .select('pet.id')
                  .whereRef('pet.owner_id', '=', 'person.id')
              )
            )
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id")',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person` where not exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id`)',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person" where not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id")',
            parameters: [],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(0)
      })

      it('case expression', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((eb) =>
            eb
              .case()
              .when('first_name', '=', 'Jennifer')
              .then(sql.lit(true))
              .else(sql.lit(false))
              .end()
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where case when "first_name" = $1 then true else false end',
            parameters: ['Jennifer'],
          },
          mysql: {
            sql: 'select * from `person` where case when `first_name` = ? then true else false end',
            parameters: ['Jennifer'],
          },
          sqlite: {
            sql: 'select * from "person" where case when "first_name" = ? then true else false end',
            parameters: ['Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(1)
      })

      it('single raw instance', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(sql`first_name between ${'Arnold'} and ${'Jennifer'}`)
          .where(sql`last_name between ${'A'} and ${'Z'}`)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where first_name between $1 and $2 and last_name between $3 and $4',
            parameters: ['Arnold', 'Jennifer', 'A', 'Z'],
          },
          mysql: {
            sql: 'select * from `person` where first_name between ? and ? and last_name between ? and ?',
            parameters: ['Arnold', 'Jennifer', 'A', 'Z'],
          },
          sqlite: {
            sql: 'select * from "person" where first_name between ? and ? and last_name between ? and ?',
            parameters: ['Arnold', 'Jennifer', 'A', 'Z'],
          },
        })

        await query.execute()
      })
    })

    describe('whereRef', () => {
      it('should compare two columns', async () => {
        const query = ctx.db
          .selectFrom(['person', 'pet'])
          .selectAll()
          .whereRef('person.id', '=', 'pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person", "pet" where "person"."id" = "pet"."id"',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person`, `pet` where `person`.`id` = `pet`.`id`',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person", "pet" where "person"."id" = "pet"."id"',
            parameters: [],
          },
        })
      })
    })
  })
}
