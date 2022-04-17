import { CompiledQuery, Transaction } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: transaction`, () => {
    let ctx: TestContext
    let executedQueries: CompiledQuery[] = []

    before(async function () {
      ctx = await initTest(this, dialect, (event) => {
        if (event.level === 'query') {
          executedQueries.push(event.query)
        }
      })
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
      executedQueries = []
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    if (dialect !== 'sqlite') {
      it('should set the transaction isolation level', async () => {
        await ctx.db
          .transaction()
          .setIsolationLevel('serializable')
          .execute(async (trx) => {
            await trx
              .insertInto('person')
              .values({
                first_name: 'Foo',
                last_name: 'Barson',
                gender: 'male',
              })
              .execute()
          })

        if (dialect == 'postgres') {
          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            }))
          ).to.eql([
            {
              sql: 'start transaction isolation level serializable',
              parameters: [],
            },
            {
              sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
              parameters: ['Foo', 'Barson', 'male'],
            },
            { sql: 'commit', parameters: [] },
          ])
        } else if (dialect === 'mysql') {
          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            }))
          ).to.eql([
            {
              sql: 'set transaction isolation level serializable',
              parameters: [],
            },
            {
              sql: 'begin',
              parameters: [],
            },
            {
              sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
              parameters: ['Foo', 'Barson', 'male'],
            },
            { sql: 'commit', parameters: [] },
          ])
        }
      })
    }

    if (dialect === 'postgres') {
      it('should be able to start a transaction with a single connection', async () => {
        const result = await ctx.db.connection().execute((db) => {
          return db.transaction().execute((trx) => {
            return trx
              .insertInto('person')
              .values({
                first_name: 'Foo',
                last_name: 'Barson',
                gender: 'male',
              })
              .returning('first_name')
              .executeTakeFirstOrThrow()
          })
        })

        expect(result.first_name).to.equal('Foo')
      })
    }

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
          id: id,
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
