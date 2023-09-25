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
  })
}
