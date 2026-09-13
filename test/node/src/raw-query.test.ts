import { CamelCasePlugin, sql } from '../../../dist/index.js'

import {
  clearDatabase,
  destroyTest,
  initTest,
  type TestContext,
  expect,
  insertDefaultDataSet,
  testSql,
  DIALECTS,
  POOL_SIZE,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: raw queries`, () => {
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

    it('should run a raw select query', async () => {
      const gender = 'male'

      const result = await sql<{
        first_name: string
      }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.execute(
        ctx.db,
      )

      expect(result.insertId).to.equal(undefined)
      expect(result.numAffectedRows).to.equal(
        {
          [variant]: undefined,
          mssql: 2n,
          pglite: 0n,
        }[variant],
      )
      expect(result.rows).to.eql([
        { first_name: 'Arnold' },
        { first_name: 'Sylvester' },
      ])
    })

    if (variant !== 'pglite') {
      describe('stream', () => {
        for (const options of [
          undefined,
          2,
          { chunkSize: 2 },
          { signal: new AbortController().signal },
        ]) {
          it(`should stream a parameterized raw query with options ${JSON.stringify(options)}`, async () => {
            const rows: { first_name: string }[] = []

            for await (const row of sql<{
              first_name: string
            }>`select first_name from person where first_name <> ${'Nobody'} order by first_name`.stream(
              ctx.db,
              options,
            )) {
              rows.push(row)
            }

            expect(rows).to.eql([
              { first_name: 'Arnold' },
              { first_name: 'Jennifer' },
              { first_name: 'Sylvester' },
            ])
          })
        }

        it('should yield no rows for an empty result', async () => {
          const rows: unknown[] = []

          for await (const row of sql`select * from person where first_name = ${'Nobody'}`.stream(
            ctx.db,
          )) {
            rows.push(row)
          }

          expect(rows).to.eql([])
        })

        it('should apply raw builder query and result plugins', async () => {
          const rows: { firstName: string }[] = []

          for await (const row of sql<{
            firstName: string
          }>`select ${sql.ref('firstName')} from person where ${sql.ref('firstName')} = ${'Jennifer'}`
            .withPlugin(new CamelCasePlugin())
            .stream(ctx.db, 1)) {
            rows.push(row)
          }

          expect(rows).to.eql([{ firstName: 'Jennifer' }])
        })

        it('should stream using a transaction as the executor provider', async () => {
          await ctx.db.transaction().execute(async (trx) => {
            await trx
              .updateTable('person')
              .set('first_name', 'Updated')
              .where('first_name', '=', 'Jennifer')
              .execute()

            const rows: { first_name: string }[] = []

            for await (const row of sql<{
              first_name: string
            }>`select first_name from person where first_name = ${'Updated'}`.stream(
              trx,
            )) {
              rows.push(row)
            }

            expect(rows).to.eql([{ first_name: 'Updated' }])
          })
        })

        it('should release the connection when iteration stops early', async () => {
          for (let i = 0; i <= POOL_SIZE + 1; ++i) {
            const stream = sql`select * from person`.stream(ctx.db, 1)

            for await (const _ of stream) {
              break
            }

            expect(await stream.next()).to.eql({ done: true, value: undefined })
          }
        })

        it('should propagate query errors and release the connection', async () => {
          for (let i = 0; i <= POOL_SIZE + 1; ++i) {
            const stream = sql`select nonexistent_column from person`.stream(
              ctx.db,
            )

            await expect(stream.next()).to.be.rejectedWith(Error)
          }
        })

        it('should reject when aborted before streaming', async () => {
          const reason = new Error('aborted before raw query streaming')
          const stream = sql`select * from person`.stream(ctx.db, {
            signal: AbortSignal.abort(reason),
          })

          await expect(stream.next()).to.be.rejectedWith(reason)
        })

        it('should reject when aborted during streaming', async () => {
          const controller = new AbortController()
          const reason = new Error('aborted during raw query streaming')
          const stream = sql`select * from person`.stream(ctx.db, {
            chunkSize: 1,
            signal: controller.signal,
          })

          expect((await stream.next()).done).to.equal(false)
          controller.abort(reason)

          await expect(stream.next()).to.be.rejectedWith(reason)
        })

        if (variant === 'postgres' || variant === 'sqlite') {
          for (const [operation, query, expected] of [
            [
              'insert',
              sql<{
                first_name: string
              }>`insert into person (first_name, gender) values (${'Moses'}, ${'male'}), (${'Erykah'}, ${'female'}) returning first_name`,
              [{ first_name: 'Moses' }, { first_name: 'Erykah' }],
            ],
            [
              'update',
              sql<{
                first_name: string
              }>`update person set last_name = ${'Updated'} where gender = ${'male'} returning first_name`,
              [{ first_name: 'Arnold' }, { first_name: 'Sylvester' }],
            ],
            [
              'delete',
              sql<{
                first_name: string
              }>`delete from person where gender = ${'male'} returning first_name`,
              [{ first_name: 'Arnold' }, { first_name: 'Sylvester' }],
            ],
          ] as const) {
            it(`should stream returned rows from a raw ${operation} query`, async () => {
              const rows: { first_name: string }[] = []

              for await (const row of query.stream(ctx.db, 1)) {
                rows.push(row)
              }

              expect(rows).to.have.deep.members(expected)
            })
          }
        }
      })
    }

    it('should run a raw update query', async () => {
      const newFirstName = 'Updated'
      const gender = 'male'

      const result =
        await sql`update person set first_name = ${newFirstName} where gender = ${gender}`.execute(
          ctx.db,
        )

      expect(result.numAffectedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    it('should run a raw delete query', async () => {
      const gender = 'male'

      const result =
        await sql`delete from person where gender = ${gender}`.execute(ctx.db)

      expect(result.numAffectedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    if (sqlSpec === 'postgres' || sqlSpec === 'sqlite') {
      it('should run a raw insert query', async () => {
        const firstName = 'New'
        const lastName = 'Personsson'
        const gender = 'other'

        const result =
          await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender}) returning first_name, last_name`.execute(
            ctx.db,
          )

        expect(result.insertId).to.equal(undefined)
        expect(result.rows).to.eql([
          { first_name: 'New', last_name: 'Personsson' },
        ])
      })
    }

    if (sqlSpec === 'mysql') {
      it('should run a raw insert query', async () => {
        const firstName = 'New'
        const lastName = 'Personsson'
        const gender = 'other'

        const result =
          await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender})`.execute(
            ctx.db,
          )

        expect(result.insertId! > 0n).to.be.equal(true)
        expect(result.rows).to.eql([])
      })
    }

    it('should compile a raw select query', async () => {
      const gender = 'male'

      const query = sql`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`

      testSql({ compile: () => query.compile(ctx.db) }, dialect, {
        postgres: {
          sql: 'select first_name from person where gender = $1 order by first_name asc, last_name asc',
          parameters: [gender],
        },
        mysql: {
          sql: 'select first_name from person where gender = ? order by first_name asc, last_name asc',
          parameters: [gender],
        },
        mssql: {
          sql: 'select first_name from person where gender = @1 order by first_name asc, last_name asc',
          parameters: [gender],
        },
        sqlite: {
          sql: 'select first_name from person where gender = ? order by first_name asc, last_name asc',
          parameters: [gender],
        },
      })
    })
  })
}
