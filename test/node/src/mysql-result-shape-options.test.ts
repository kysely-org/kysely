import { createPool, type Pool, type PoolOptions } from 'mysql2'
import { Kysely, MysqlDialect, sql } from '../../../dist/index.js'
import { DIALECTS, DIALECT_CONFIGS, expect } from './test-setup.js'

const VARIANT = 'mysql'

const UNSUPPORTED_OPTIONS: {
  name: string
  options: PoolOptions
  error: string
}[] = [
  {
    name: 'nestTables: true',
    options: { nestTables: true },
    error: 'nestTables',
  },
  {
    name: "nestTables: '_'",
    options: { nestTables: '_' },
    error: 'nestTables',
  },
  { name: "nestTables: ''", options: { nestTables: '' }, error: 'nestTables' },
  {
    name: 'rowsAsArray: true',
    options: { rowsAsArray: true },
    error: 'rowsAsArray',
  },
]

if (DIALECTS.some((d) => d.variant === VARIANT)) {
  describe(`${VARIANT}: result shape options`, () => {
    for (const { name, options, error } of UNSUPPORTED_OPTIONS) {
      it(`should throw in the driver constructor for an eager pool with ${name}`, async () => {
        const pool = createPool({ ...DIALECT_CONFIGS[VARIANT], ...options })

        try {
          expect(
            () => new Kysely({ dialect: new MysqlDialect({ pool }) }),
          ).to.throw(`mysql2's \`${error}\` pool option is not supported`)
        } finally {
          await new Promise((resolve) => pool.end(resolve))
        }
      })

      it(`should throw in init and end the pool for a lazy pool with ${name}`, async () => {
        const pools: Pool[] = []
        const endedPools: Pool[] = []

        const db = new Kysely({
          dialect: new MysqlDialect({
            pool: async () => {
              const pool = createPool({
                ...DIALECT_CONFIGS[VARIANT],
                ...options,
              })
              const end = pool.end.bind(pool)

              pool.end = ((callback?: (err: unknown) => void) => {
                endedPools.push(pool)
                end(callback)
              }) as Pool['end']

              pools.push(pool)
              return pool
            },
          }),
        })

        try {
          await expect(sql`select 1`.execute(db)).to.be.rejectedWith(
            `mysql2's \`${error}\` pool option is not supported`,
          )

          // `init` is retried on the next query, and every rejected pool is ended.
          await expect(sql`select 1`.execute(db)).to.be.rejectedWith(
            `mysql2's \`${error}\` pool option is not supported`,
          )

          expect(pools).to.have.length(2)
          expect(endedPools).to.deep.equal(pools)
        } finally {
          await db.destroy()
        }
      })
    }

    it('should accept the default and disabled values of these options', async () => {
      const db = new Kysely({
        dialect: new MysqlDialect({
          pool: createPool({
            ...DIALECT_CONFIGS[VARIANT],
            nestTables: false,
            rowsAsArray: false,
          }),
        }),
      })

      try {
        const { rows } = await sql<{ id: number }>`
          select t.id from (select 42 as id) as t
        `.execute(db)

        expect(rows).to.deep.equal([{ id: 42 }])
      } finally {
        await db.destroy()
      }
    })
  })
}
