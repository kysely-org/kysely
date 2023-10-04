import { MergeResult } from '../../..'
import {
  DIALECTS,
  NOT_SUPPORTED,
  TestContext,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS.filter(
  (dialect) => dialect === 'postgres' || dialect === 'mssql'
)) {
  describe.only(`merge (${dialect})`, () => {
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

    it('should perform a merge...using table simple on...when matched then delete query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenDelete()

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete',
          parameters: [],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
          parameters: [],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table alias simple on alias...when matched then delete query', async () => {
      const query = ctx.db
        .mergeInto('person as pr')
        .using('pet as pt', 'pt.owner_id', 'pr.id')
        .whenMatched()
        .thenDelete()

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" as "pr" using "pet" as "pt" on "pt"."owner_id" = "pr"."id" when matched then delete',
          parameters: [],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" as "pr" using "pet" as "pt" on "pt"."owner_id" = "pr"."id" when matched then delete;',
          parameters: [],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table complex on...when matched then delete query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', (on) =>
          on
            .onRef('pet.owner_id', '=', 'person.id')
            .on('pet.name', '=', 'Lucky')
        )
        .whenMatched()
        .thenDelete()

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = $1 when matched then delete',
          parameters: ['Lucky'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = @1 when matched then delete;',
          parameters: ['Lucky'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(0n)
    })

    it('should perform a merge...using subquery simple on...when matched then delete query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using(
          ctx.db
            .selectFrom('pet')
            .select('owner_id')
            .where('name', '=', 'Lucky')
            .as('pet'),
          'pet.owner_id',
          'person.id'
        )
        .whenMatched()
        .thenDelete()

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using (select "owner_id" from "pet" where "name" = $1) as "pet" on "pet"."owner_id" = "person"."id" when matched then delete',
          parameters: ['Lucky'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using (select "owner_id" from "pet" where "name" = @1) as "pet" on "pet"."owner_id" = "person"."id" when matched then delete;',
          parameters: ['Lucky'],
        },
        sqlite: NOT_SUPPORTED,
      })
    })

    if (dialect === 'postgres') {
      it('should perform a merge...using table...when matched then do nothing query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenMatched()
          .thenDoNothing()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then do nothing',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(0n)
      })
    }

    it('should perform a merge...using table simple on...when matched then update set object query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenUpdateSet({
          middle_name: 'pet owner',
        })

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = $1',
          parameters: ['pet owner'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = @1;',
          parameters: ['pet owner'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table simple on...when matched then update set object cross ref query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenUpdateSet((eb) => ({
          middle_name: eb.ref('pet.name'),
        }))

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name"',
          parameters: [],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name";',
          parameters: [],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table simple on...when matched then update set column query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenUpdateSet('middle_name', 'pet owner')

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = $1',
          parameters: ['pet owner'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = @1;',
          parameters: ['pet owner'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table simple on...when matched then update set column cross ref query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenUpdateSet('middle_name', (eb) => eb.ref('pet.name'))

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name"',
          parameters: [],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name";',
          parameters: [],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table simple on...when matched then update set complex query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', 'pet.owner_id', 'person.id')
        .whenMatched()
        .thenUpdate((ub) =>
          ub
            .set('middle_name', (eb) => eb.ref('pet.name'))
            .set({
              marital_status: 'single',
            })
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name", "marital_status" = $1',
          parameters: ['single'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when matched then update set "middle_name" = "pet"."name", "marital_status" = @1;',
          parameters: ['single'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    if (dialect === 'postgres') {
      it('should perform a merge...using table simple on...when not matched then do nothing query', async () => {
        const query = ctx.db
          .mergeInto('person')
          .using('pet', 'pet.owner_id', 'person.id')
          .whenNotMatched()
          .thenDoNothing()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" when not matched then do nothing',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.executeTakeFirstOrThrow()

        expect(result).to.be.instanceOf(MergeResult)
        expect(result.numChangedRows).to.equal(0n)
      })
    }

    it('should perform a merge...using table simple on...when not matched then insert values query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', (on) =>
          on
            .onRef('pet.owner_id', '=', 'person.id')
            .on('pet.name', '=', 'NO_SUCH_PET_NAME')
        )
        .whenNotMatched()
        .thenInsertValues({
          gender: 'male',
          first_name: 'Dingo',
          middle_name: 'the',
          last_name: 'Dog',
        })

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = $1 when not matched then insert ("gender", "first_name", "middle_name", "last_name") values ($2, $3, $4, $5)',
          parameters: ['NO_SUCH_PET_NAME', 'male', 'Dingo', 'the', 'Dog'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" = "person"."id" and "pet"."name" = @1 when not matched then insert ("gender", "first_name", "middle_name", "last_name") values (@2, @3, @4, @5);',
          parameters: ['NO_SUCH_PET_NAME', 'male', 'Dingo', 'the', 'Dog'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })

    it('should perform a merge...using table simple on...when not matched then insert values cross ref query', async () => {
      const query = ctx.db
        .mergeInto('person')
        .using('pet', (on) => on.on('pet.owner_id', 'is', null))
        .whenNotMatched()
        .thenInsertValues((eb) => ({
          gender: 'other',
          first_name: eb.ref('pet.name'),
          middle_name: 'the',
          last_name: eb.ref('pet.species'),
        }))

      testSql(query, dialect, {
        postgres: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" is null when not matched then insert ("gender", "first_name", "middle_name", "last_name") values ($1, "pet"."name", $2, "pet"."species")',
          parameters: ['other', 'the'],
        },
        mysql: NOT_SUPPORTED,
        mssql: {
          sql: 'merge into "person" using "pet" on "pet"."owner_id" is null when not matched then insert ("gender", "first_name", "middle_name", "last_name") values (@1, "pet"."name", @2, "pet"."species");',
          parameters: ['other', 'the'],
        },
        sqlite: NOT_SUPPORTED,
      })

      const result = await query.executeTakeFirstOrThrow()

      expect(result).to.be.instanceOf(MergeResult)
      expect(result.numChangedRows).to.equal(3n)
    })
  })
}
