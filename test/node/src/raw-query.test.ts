import { NoResultError, QueryNode, RawNode, sql } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: raw queries`, () => {
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

    describe('execute', () => {
      it('should run a raw select query', async () => {
        const gender = 'male'

        const result = await sql<{
          first_name: string
        }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.execute(
          ctx.db
        )

        expect(result.insertId).to.equal(undefined)
        expect(result.numUpdatedOrDeletedRows).to.equal(undefined)
        expect(result.rows).to.eql([
          { first_name: 'Arnold' },
          { first_name: 'Sylvester' },
        ])
      })

      it('should run a raw update query', async () => {
        const newFirstName = 'Updated'
        const gender = 'male'

        const result =
          await sql`update person set first_name = ${newFirstName} where gender = ${gender}`.execute(
            ctx.db
          )

        expect(result.numUpdatedOrDeletedRows).to.equal(2n)
        expect(result.rows).to.eql([])
      })

      it('should run a raw delete query', async () => {
        const gender = 'male'

        const result =
          await sql`delete from person where gender = ${gender}`.execute(ctx.db)

        expect(result.numUpdatedOrDeletedRows).to.equal(2n)
        expect(result.rows).to.eql([])
      })

      if (dialect === 'postgres') {
        it('should run a raw insert query', async () => {
          const firstName = 'New'
          const lastName = 'Personsson'
          const gender = 'other'

          const result =
            await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender}) returning first_name, last_name`.execute(
              ctx.db
            )

          expect(result.insertId).to.equal(undefined)
          expect(result.rows).to.eql([
            { first_name: 'New', last_name: 'Personsson' },
          ])
        })
      } else {
        it('should run a raw insert query', async () => {
          const firstName = 'New'
          const lastName = 'Personsson'
          const gender = 'other'

          const result =
            await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender})`.execute(
              ctx.db
            )

          expect(result.insertId! > 0n).to.be.equal(true)
          expect(result.rows).to.eql([])
        })
      }
    })

    describe('executeTakeFirstRow', () => {
      it('should run a raw select query and return first row', async () => {
        const gender = 'male'

        const result = await sql<{
          first_name: string
        }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.executeTakeFirstRow(
          ctx.db
        )

        expect(result).to.deep.equal({ first_name: 'Arnold' })
      })

      it('should run a raw select query and return undefined when no rows returned', async () => {
        const gender = 'NO_SUCH_GENDER'

        const result = await sql<{
          first_name: string
        }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.executeTakeFirstRow(
          ctx.db
        )

        expect(result).to.be.undefined
      })
    })

    describe('executeTakeFirstRowOrThrow', () => {
      it('should run a raw select query and return first row', async () => {
        const gender = 'male'

        const result = await sql<{
          first_name: string
        }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.executeTakeFirstRowOrThrow(
          ctx.db
        )

        expect(result).to.deep.equal({ first_name: 'Arnold' })
      })

      it('should run a raw select query and throw NoResultError when no rows returned', async () => {
        const gender = 'NO_SUCH_GENDER'

        try {
          await sql<{
            first_name: string
          }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.executeTakeFirstRowOrThrow(
            ctx.db
          )
        } catch (error) {
          expect(error instanceof NoResultError).to.be.true
        }
      })

      it('should run a raw select query and throw a custom error when no rows returned', async () => {
        const gender = 'NO_SUCH_GENDER'
        class MyNotFoundError extends Error {
          node: QueryNode | RawNode

          constructor(node: QueryNode | RawNode) {
            super('custom error')
            this.node = node
          }
        }

        try {
          await sql<{
            first_name: string
          }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.executeTakeFirstRowOrThrow(
            ctx.db,
            MyNotFoundError
          )
        } catch (error) {
          expect(error instanceof MyNotFoundError).to.be.true

          if (error instanceof MyNotFoundError) {
            expect(error.node.kind).to.equal('RawNode')
          }
        }
      })
    })
  })
}
