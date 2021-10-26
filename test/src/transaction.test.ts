import { CompiledQuery, Transaction } from '../../'
import { getExecutedQueries } from './utils/get-executed-queries'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: transaction`, () => {
    let ctx: TestContext
    let executedQueries: CompiledQuery[]

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      const [wrapper, queries] = getExecutedQueries()

      executedQueries = queries
      ctx = await initTest(dialect, wrapper)
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

    it('should set the transaction isolation level', async () => {
      executedQueries.splice(0, executedQueries.length)

      await ctx.db
        .transaction()
        .setIsolationLevel('serializable')
        .execute(async (trx) => {
          await trx
            .insertInto('person')
            .values({
              id: ctx.db.generated,
              first_name: 'Foo',
              last_name: 'Barson',
              gender: 'male',
            })
            .execute()
        })

      if (dialect == 'postgres') {
        expect(executedQueries).to.eql([
          {
            sql: 'start transaction isolation level serializable',
            bindings: [],
          },
          {
            sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
            bindings: ['Foo', 'Barson', 'male'],
          },
          { sql: 'commit', bindings: [] },
        ])
      } else if (dialect === 'mysql') {
        expect(executedQueries).to.eql([
          {
            sql: 'set transaction isolation level serializable',
            bindings: [],
          },
          {
            sql: 'begin',
            bindings: [],
          },
          {
            sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
            bindings: ['Foo', 'Barson', 'male'],
          },
          { sql: 'commit', bindings: [] },
        ])
      }
    })

    it('should run multiple transactions in parallel', async () => {
      const threads = Array.from({ length: 100 }).map((_, index) => ({
        id: 1000000 + index + 1,
        fails: Math.random() < 0.5,
      }))

      const results = await Promise.allSettled(
        threads.map((thread) => executeThread(thread.id, thread.fails))
      )

      for (let i = 0; i < threads.length; ++i) {
        const [personExists, petExists] = await Promise.all([
          doesPersonExists(threads[i].id),
          doesPetExists(threads[i].id),
        ])

        if (threads[i].fails) {
          expect(personExists).to.equal(false)
          expect(petExists).to.equal(false)
          expect(results[i].status === 'rejected')
        } else {
          expect(personExists).to.equal(true)
          expect(petExists).to.equal(true)
          expect(results[i].status === 'fulfilled')
        }
      }

      async function executeThread(id: number, fails: boolean): Promise<void> {
        await ctx.db.transaction().execute(async (trx) => {
          await insertPerson(trx, id)
          await insertPet(trx, id)

          if (fails) {
            throw new Error()
          }
        })
      }
    })

    async function insertPet(
      trx: Transaction<Database>,
      ownerId: number
    ): Promise<void> {
      await trx
        .insertInto('pet')
        .values({
          id: ctx.db.generated,
          name: `Pet of ${ownerId}`,
          owner_id: ownerId,
          species: 'cat',
        })
        .execute()
    }

    async function insertPerson(
      trx: Transaction<Database>,
      id: number
    ): Promise<void> {
      await trx
        .insertInto('person')
        .values({
          id: id ?? ctx.db.generated,
          first_name: `Person ${id}`,
          last_name: null,
          gender: 'other',
        })
        .execute()
    }

    async function doesPersonExists(id: number): Promise<boolean> {
      return !!(await ctx.db
        .selectFrom('person')
        .select('id')
        .where('id', '=', id)
        .where('first_name', '=', `Person ${id}`)
        .executeTakeFirst())
    }

    async function doesPetExists(ownerId: number): Promise<boolean> {
      return !!(await ctx.db
        .selectFrom('pet')
        .select('id')
        .where('owner_id', '=', ownerId)
        .where('name', '=', `Pet of ${ownerId}`)
        .executeTakeFirst())
    }
  })
}
