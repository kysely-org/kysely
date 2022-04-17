import { sql } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
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
            (qb) =>
              qb
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
          .where(sql`${'Catto'}`, '=', (qb) =>
            qb
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

      it('two where clauses', async () => {
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

      it('single function argument should create a group', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((qb) =>
            qb
              .where('first_name', '=', 'Jennifer')
              .where('last_name', '=', 'Aniston')
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where ("first_name" = $1 and "last_name" = $2)',
            parameters: ['Jennifer', 'Aniston'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? and `last_name` = ?)',
            parameters: ['Jennifer', 'Aniston'],
          },
          sqlite: {
            sql: 'select * from "person" where ("first_name" = ? and "last_name" = ?)',
            parameters: ['Jennifer', 'Aniston'],
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

    describe('orWhere', () => {
      it('two where clauses', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .orWhere('first_name', '=', 'Jennifer')

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1 or "first_name" = $2',
            parameters: ['Arnold', 'Jennifer'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ? or `first_name` = ?',
            parameters: ['Arnold', 'Jennifer'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ? or "first_name" = ?',
            parameters: ['Arnold', 'Jennifer'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('two where clause groups', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'Arnold')
          .orWhere((qb) =>
            qb
              .where('first_name', '=', 'Jennifer')
              .where('last_name', '=', 'Aniston')
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "first_name" = $1 or ("first_name" = $2 and "last_name" = $3)',
            parameters: ['Arnold', 'Jennifer', 'Aniston'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` = ? or (`first_name` = ? and `last_name` = ?)',
            parameters: ['Arnold', 'Jennifer', 'Aniston'],
          },
          sqlite: {
            sql: 'select * from "person" where "first_name" = ? or ("first_name" = ? and "last_name" = ?)',
            parameters: ['Arnold', 'Jennifer', 'Aniston'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })

      it('single raw instance', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((qb) =>
            qb
              .where(sql`first_name between ${'Arnold'} and ${'Jennifer'}`)
              .orWhere(sql`last_name between ${'A'} and ${'Z'}`)
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where (first_name between $1 and $2 or last_name between $3 and $4)',
            parameters: ['Arnold', 'Jennifer', 'A', 'Z'],
          },
          mysql: {
            sql: 'select * from `person` where (first_name between ? and ? or last_name between ? and ?)',
            parameters: ['Arnold', 'Jennifer', 'A', 'Z'],
          },
          sqlite: {
            sql: 'select * from "person" where (first_name between ? and ? or last_name between ? and ?)',
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

    describe('orWhereRef', () => {
      it('should compare two columns', async () => {
        const query = ctx.db
          .selectFrom(['person', 'pet'])
          .selectAll()
          .where((qb) =>
            qb
              .whereRef('person.id', '=', 'pet.id')
              .orWhereRef('person.first_name', '=', 'pet.name')
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person", "pet" where ("person"."id" = "pet"."id" or "person"."first_name" = "pet"."name")',
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person`, `pet` where (`person`.`id` = `pet`.`id` or `person`.`first_name` = `pet`.`name`)',
            parameters: [],
          },
          sqlite: {
            sql: 'select * from "person", "pet" where ("person"."id" = "pet"."id" or "person"."first_name" = "pet"."name")',
            parameters: [],
          },
        })
      })
    })

    describe('whereExists', () => {
      it('should accept a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .whereExists((qb) =>
            qb
              .selectFrom('pet')
              .select('pet.id')
              .whereRef('pet.owner_id', '=', 'person.id')
              .where('pet.species', '=', 'dog')
          )

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = $1)`,
            parameters: ['dog'],
          },
          mysql: {
            sql: 'select * from `person` where exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id` and `pet`.`species` = ?)',
            parameters: ['dog'],
          },
          sqlite: {
            sql: `select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = ?)`,
            parameters: ['dog'],
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

      it('should accept a raw instance', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .whereExists(
            sql`(select ${sql.ref('pet.id')} from ${sql.ref(
              'pet'
            )} where ${sql.ref('pet.owner_id')} = ${sql.ref(
              'person.id'
            )} and ${sql.ref('pet.species')} = ${'cat'})`
          )

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = $1)`,
            parameters: ['cat'],
          },
          mysql: {
            sql: 'select * from `person` where exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id` and `pet`.`species` = ?)',
            parameters: ['cat'],
          },
          sqlite: {
            sql: `select * from "person" where exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = ?)`,
            parameters: ['cat'],
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
    })

    describe('orWhereExists', () => {
      it('should accept a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where((qb) =>
            qb
              .where('first_name', '=', 'Jennifer')
              .orWhereExists((qb) =>
                qb
                  .selectFrom('pet')
                  .select('pet.id')
                  .whereRef('pet.owner_id', '=', 'person.id')
                  .where('pet.species', '=', 'hamster')
              )
          )

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" where ("first_name" = $1 or exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = $2))`,
            parameters: ['Jennifer', 'hamster'],
          },
          mysql: {
            sql: 'select * from `person` where (`first_name` = ? or exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id` and `pet`.`species` = ?))',
            parameters: ['Jennifer', 'hamster'],
          },
          sqlite: {
            sql: `select * from "person" where ("first_name" = ? or exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = ?))`,
            parameters: ['Jennifer', 'hamster'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Sylvester',
            last_name: 'Stallone',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })
    })

    describe('whereNotExists', () => {
      it('should accept a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .whereNotExists((qb) =>
            qb
              .selectFrom('pet')
              .select('pet.id')
              .whereRef('pet.owner_id', '=', 'person.id')
              .where('pet.species', '=', 'dog')
          )

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" where not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = $1)`,
            parameters: ['dog'],
          },
          mysql: {
            sql: 'select * from `person` where not exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id` and `pet`.`species` = ?)',
            parameters: ['dog'],
          },
          sqlite: {
            sql: `select * from "person" where not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = ?)`,
            parameters: ['dog'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Sylvester',
            last_name: 'Stallone',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })
    })

    describe('orWhereNotExists', () => {
      it('should accept a subquery', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', 'is', null)
          .orWhereNotExists((qb) =>
            qb
              .selectFrom('pet')
              .select('pet.id')
              .whereRef('pet.owner_id', '=', 'person.id')
              .where('pet.species', '=', 'hamster')
          )

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person" where "first_name" is null or not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = $1)`,
            parameters: ['hamster'],
          },
          mysql: {
            sql: 'select * from `person` where `first_name` is null or not exists (select `pet`.`id` from `pet` where `pet`.`owner_id` = `person`.`id` and `pet`.`species` = ?)',
            parameters: ['hamster'],
          },
          sqlite: {
            sql: `select * from "person" where "first_name" is null or not exists (select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id" and "pet"."species" = ?)`,
            parameters: ['hamster'],
          },
        })

        const persons = await query.execute()
        expect(persons).to.have.length(2)
        expect(persons).to.containSubset([
          {
            first_name: 'Arnold',
            last_name: 'Schwarzenegger',
            gender: 'male',
          },
          {
            first_name: 'Jennifer',
            last_name: 'Aniston',
            gender: 'female',
          },
        ])
      })
    })
  })
}
